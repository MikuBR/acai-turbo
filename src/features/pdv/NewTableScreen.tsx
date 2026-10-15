import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useStore } from '../../store/useStore'
import NewTableModal from '../../components/organisms/NewTableModal.tsx'
import { usePerformanceMark } from '../../hooks/usePerformanceMark'

interface DelivForm {
  name: string
  phone: string
  address: string
  fee: string
}

export default function NewTableScreen() {
  const navigate = useNavigate();
  const { addTable } = useStore();
  const { mark, measure } = usePerformanceMark();

  const [tableType, setTableType] = useState('SALAO');
  const [newTableName, setNewTableName] = useState('');
  const [delivForm, setDelivForm] = useState<DelivForm>({ name: '', phone: '', address: '', fee: '' });

  const handleAddTable = () => {
    mark('new-table:add:start');
    if (tableType === 'SALAO') {
      if (!newTableName.trim()) return;
      let name = newTableName.trim();
      if (/^\d+$/.test(name)) name = `MESA ${name.padStart(2, '0')}`;
      else name = name.toUpperCase();
      addTable(name);
    } else {
      if (!delivForm.name.trim()) return;
      addTable({
        name: delivForm.name.trim().toUpperCase(),
        isDelivery: true,
        phone: delivForm.phone,
        address: delivForm.address,
        fee: parseFloat(delivForm.fee || '0')
      });
    }
    setNewTableName('');
    setDelivForm({ name: '', phone: '', address: '', fee: '' });
    mark('new-table:add:end');
    const duration = measure('new-table:add:start', 'new-table:add:end');
    if (duration !== null) {
      console.log('[new-table] add duration:', duration, 'ms');
    }
    navigate('/pdv');
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-surface p-6">
      <NewTableModal
        isOpen={true}
        onClose={() => navigate('/pdv')}
        tableType={tableType}
        setTableType={setTableType}
        newTableName={newTableName}
        setNewTableName={setNewTableName}
        delivForm={delivForm}
        setDelivForm={setDelivForm}
        handleAddTable={handleAddTable}
      />
    </div>
  );
}
