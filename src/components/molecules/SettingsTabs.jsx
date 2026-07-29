import { Package, Tag, Shield, Users, Package2, DollarSign, UserCheck, Printer, Wifi } from 'lucide-react';
import SettingsTab from './SettingsTab';

const tabs = [
  { id: 'products', label: 'Produtos', icon: Package },
  { id: 'promotions', label: 'Promoções', icon: Tag },
  { id: 'security', label: 'Segurança', icon: Shield },
  { id: 'users', label: 'Usuários', icon: Users },
  { id: 'inventory', label: 'Estoque', icon: Package2 },
  { id: 'financial', label: 'Financeiro', icon: DollarSign },
  { id: 'clients', label: 'Clientes', icon: UserCheck },
  { id: 'printers', label: 'Impressoras', icon: Printer },
  { id: 'ifood', label: 'iFood', icon: Wifi },
];

export default function SettingsTabs({ activeTab, onTabChange }) {
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