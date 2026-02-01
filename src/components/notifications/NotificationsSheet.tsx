import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCheck, Bell } from 'lucide-react';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';

interface NotificationsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsSheet = ({ isOpen, onClose }: NotificationsSheetProps) => {
  const [activeTab, setActiveTab] = useState('all');
  const { data: notifications, isLoading } = useNotifications();
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead, isPending: isMarkingAll } = useMarkAllAsRead();

  const unreadNotifications = notifications?.filter(n => !n.is_read) || [];
  const displayedNotifications = activeTab === 'unread' 
    ? unreadNotifications 
    : notifications || [];

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    // TODO: Navegar para o post ou perfil relevante
    onClose();
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notificações
            </SheetTitle>
            
            {unreadNotifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAll}
                className="text-xs"
              >
                {isMarkingAll ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <CheckCheck className="w-4 h-4 mr-1" />
                )}
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-[calc(100vh-80px)]">
          <TabsList className="grid w-full grid-cols-2 mx-6 mt-4" style={{ width: 'calc(100% - 48px)' }}>
            <TabsTrigger value="all">
              Todas
            </TabsTrigger>
            <TabsTrigger value="unread" className="relative">
              Não lidas
              {unreadNotifications.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                  {unreadNotifications.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="all" className="m-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : displayedNotifications.length > 0 ? (
                <div>
                  {displayedNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Nenhuma notificação</p>
                  <p className="text-sm mt-1">
                    Quando alguém interagir com você, aparecerá aqui
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="unread" className="m-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : unreadNotifications.length > 0 ? (
                <div>
                  {unreadNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Tudo em dia!</p>
                  <p className="text-sm mt-1">
                    Você não tem notificações não lidas
                  </p>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
