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

      let coverUrl: string | null = null;

      // Upload da imagem de capa se fornecida
      if (data.coverImage) {
        const fileExt = data.coverImage.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const filePath = `group-covers/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('group-covers')
          .upload(filePath, data.coverImage);

        if (uploadError) {
          throw new Error('Erro ao fazer upload da imagem');
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
          member_count: 1,
        })
        .select()
        .single();

      if (groupError) {
        throw groupError;
      }

      // Criar membership como admin
      const { error: membershipError } = await supabase
        .from('group_memberships')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin',
        });

      if (membershipError) {
        throw membershipError;
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
      form.setValue('coverImage', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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
              rules={{ required: 'Nome do grupo é obrigatório' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Grupo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Harley Owners SP" {...field} />
                  </FormControl>
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
              <Button type="submit" disabled={createGroupMutation.isPending}>
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
