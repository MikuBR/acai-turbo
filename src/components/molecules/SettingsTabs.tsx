import { Package, Tag, Users, DollarSign, UserCheck, Printer, Wifi } from 'lucide-react';
import SettingsTab from './SettingsTab';

const tabs = [
  { id: 'products', label: 'Produtos', icon: Package },
  { id: 'promotions', label: 'Promoções', icon: Tag },
  { id: 'users', label: 'Usuários e Segurança', icon: Users },
  { id: 'financial', label: 'Financeiro', icon: DollarSign },
  { id: 'clients', label: 'Clientes', icon: UserCheck },
  { id: 'printers', label: 'Impressoras', icon: Printer },
  { id: 'ifood', label: 'iFood', icon: Wifi },
];

interface SettingsTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function SettingsTabs({ activeTab, onTabChange }: SettingsTabsProps) {
  return (
    <div className="flex gap-3 p-1.5 bg-surface rounded-xl border border-border overflow-x-auto custom-scrollbar">
      {tabs.map(tab => (
        <SettingsTab
          key={tab.id}
          icon={tab.icon}
          label={tab.label}
          isActive={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
        />
      ))}
    </div>
  );
}
