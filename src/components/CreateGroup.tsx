import { useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CreateGroupProps {
  open: boolean;
  onClose: () => void;
}

interface CreateGroupForm {
  name: string;
  description: string;
  category: 'Marca' | 'Região' | 'Estilo';
  coverImage?: File;
}

export const CreateGroup = ({ open, onClose }: CreateGroupProps) => {
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<CreateGroupForm>({
    defaultValues: {
      name: '',
      description: '',
      category: 'Marca',
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: CreateGroupForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar se já existe um grupo com o mesmo nome (case-insensitive)
      const { data: existingGroups, error: checkError } = await supabase
        .from('groups')
        .select('id, name')
        .ilike('name', data.name)
        .limit(1);

      if (checkError) {
        throw new Error('Erro ao verificar nome do grupo');
      }

      if (existingGroups && existingGroups.length > 0) {
        throw new Error('Já existe um grupo com este nome. Por favor, escolha outro nome.');
      }

      let coverUrl: string | null = null;

      // Upload da imagem de capa se fornecida
      if (data.coverImage) {
        const fileExt = data.coverImage.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('group-covers')
          .upload(filePath, data.coverImage, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          
          // Mensagens de erro mais específicas
          if (uploadError.message.includes('not found')) {
            throw new Error('Bucket de imagens não configurado. Contate o administrador.');
          } else if (uploadError.message.includes('size')) {
            throw new Error('Imagem muito grande. O tamanho máximo é 5MB.');
          } else if (uploadError.message.includes('type')) {
            throw new Error('Formato de imagem não suportado. Use JPG, PNG, WEBP ou GIF.');
          } else {
            throw new Error(`Erro ao fazer upload da imagem: ${uploadError.message}`);
          }
        }

        const { data: { publicUrl } } = supabase.storage
          .from('group-covers')
          .getPublicUrl(filePath);

        coverUrl = publicUrl;
      }

      // Criar grupo
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: data.name,
          description: data.description || null,
          category: data.category,
          cover_url: coverUrl,
          owner_id: user.id,
        })
        .select()
        .single();

      if (groupError) {
        // Se houver erro e já fizemos upload, tentar limpar a imagem
        if (coverUrl) {
          await supabase.storage
            .from('group-covers')
            .remove([`${user.id}/${Date.now()}.${data.coverImage?.name.split('.').pop()}`]);
        }
        
        // Mensagem de erro específica para nome duplicado
        if (groupError.code === '23505' || groupError.message.includes('unique')) {
          throw new Error('Já existe um grupo com este nome. Por favor, escolha outro nome.');
        }
        
        throw groupError;
      }

      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      toast({
        title: 'Sucesso!',
        description: 'Grupo criado com sucesso',
      });
      form.reset();
      setCoverPreview(null);
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar o grupo',
        variant: 'destructive',
      });
    },
  });

  const handleCoverChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho do arquivo (5MB)
      if (file.size > 5242880) {
        toast({
          title: 'Erro',
          description: 'Imagem muito grande. O tamanho máximo é 5MB.',
          variant: 'destructive',
        });
        return;
      }

      // Validar tipo do arquivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Erro',
          description: 'Formato não suportado. Use JPG, PNG, WEBP ou GIF.',
          variant: 'destructive',
        });
        return;
      }

      form.setValue('coverImage', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const checkGroupNameAvailability = async (name: string) => {
    if (!name || name.length < 3) {
      setNameError(null);
      return;
    }

    setIsCheckingName(true);
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('id, name')
        .ilike('name', name)
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        setNameError('Este nome já está em uso. Escolha outro nome.');
      } else {
        setNameError(null);
      }
    } catch (error) {
      console.error('Error checking name:', error);
    } finally {
      setIsCheckingName(false);
    }
  };

  const onSubmit = (data: CreateGroupForm) => {
    createGroupMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Grupo</DialogTitle>
          <DialogDescription>
            Crie um grupo para conectar motociclistas com interesses em comum
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              rules={{ 
                required: 'Nome do grupo é obrigatório',
                minLength: {
                  value: 3,
                  message: 'O nome deve ter pelo menos 3 caracteres'
                },
                maxLength: {
                  value: 50,
                  message: 'O nome deve ter no máximo 50 caracteres'
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Grupo</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Harley Owners SP" 
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        const value = e.target.value;
                        if (value.length >= 3) {
                          checkGroupNameAvailability(value);
                        } else {
                          setNameError(null);
                        }
                      }}
                    />
                  </FormControl>
                  {isCheckingName && (
                    <p className="text-xs text-muted-foreground">
                      Verificando disponibilidade...
                    </p>
                  )}
                  {nameError && (
                    <p className="text-xs text-destructive">
                      {nameError}
                    </p>
                  )}
                  {!nameError && !isCheckingName && field.value && field.value.length >= 3 && (
                    <p className="text-xs text-green-600">
                      ✓ Nome disponível
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o propósito do grupo..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Uma descrição ajuda outros motociclistas a entenderem o grupo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              rules={{ required: 'Categoria é obrigatória' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Marca">Marca</SelectItem>
                      <SelectItem value="Região">Região</SelectItem>
                      <SelectItem value="Estilo">Estilo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Imagem de Capa (opcional)</FormLabel>
              <div className="space-y-2">
                {coverPreview ? (
                  <div className="relative">
                    <img
                      src={coverPreview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setCoverPreview(null);
                        form.setValue('coverImage', undefined);
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImageIcon className="w-8 h-8 mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Clique para fazer upload
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleCoverChange}
                    />
                  </label>
                )}
              </div>
            </FormItem>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createGroupMutation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createGroupMutation.isPending || isCheckingName || !!nameError}
              >
                {createGroupMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Criando...
                  </>
                ) : (
                  'Criar Grupo'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
