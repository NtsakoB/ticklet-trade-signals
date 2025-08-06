
import { BellIcon, GearIcon, ExitIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  return (
    <header className="border-b border-gray-800 px-6 py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-white">Ticklet</h1>
            <p className="text-xs text-muted-foreground">Trade Signal Platform</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <BellIcon className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            aria-label="Settings"
            onClick={() => navigate('/settings')}
          >
            <GearIcon className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            aria-label="Logout"
            onClick={signOut}
          >
            <ExitIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}

export default Header;
