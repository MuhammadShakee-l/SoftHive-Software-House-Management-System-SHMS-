import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Mail, Phone, FolderKanban, CreditCard } from 'lucide-react';
import clientService from '../../services/clientService';
import Loader from '../../components/common/Loader';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/helpers';

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clientService
      .getClient(id)
      .then((res) => {
        setClient(res.data.data.client);
        setInvoices(res.data.data.invoices || []);
      })
      .catch((err) => {
        console.error(err);
        navigate('/clients');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader text="Loading client..." />;
  if (!client) return null;

  const user = client.user;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <button onClick={() => navigate('/clients')} className="btn-secondary">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary-600" /> {client.companyName}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Client: {user?.name}</p>

            <div className="mt-3 space-y-1 text-sm text-gray-700 dark:text-gray-200">
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-gray-400" /> {user?.email}</p>
              <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-gray-400" /> {user?.phone || '—'}</p>
            </div>
          </div>

          <div className="w-full sm:w-80 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Overview</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-400 flex items-center gap-1"><FolderKanban className="h-3.5 w-3.5" /> Projects</p>
                <p className="text-xl font-extrabold text-gray-900 dark:text-white">{client.projects?.length || 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-400 flex items-center gap-1"><CreditCard className="h-3.5 w-3.5" /> Invoices</p>
                <p className="text-xl font-extrabold text-gray-900 dark:text-white">{invoices.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Projects</h3>
        {client.projects?.length === 0 ? (
          <p className="text-sm text-gray-400">No projects yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {client.projects.map((p) => (
              <div key={p._id} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                <p className="font-semibold text-gray-900 dark:text-white">{p.name}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`badge ${getStatusColor(p.status)}`}>{p.status}</span>
                  <span className="text-xs text-gray-400">Deadline: {formatDate(p.deadline)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Invoices</h3>
        {invoices.length === 0 ? (
          <p className="text-sm text-gray-400">No invoices yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                  <th className="pb-3 font-medium">Invoice</th>
                  <th className="pb-3 font-medium">Project</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Due</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {invoices.map((inv) => (
                  <tr key={inv._id}>
                    <td className="py-3 font-mono text-xs text-gray-700 dark:text-gray-300">{inv.invoiceId}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-300">{inv.project?.name}</td>
                    <td className="py-3 font-semibold text-gray-900 dark:text-white">{formatCurrency(inv.totalAmount)}</td>
                    <td className="py-3 text-gray-500">{formatDate(inv.dueDate)}</td>
                    <td className="py-3"><span className={`badge ${getStatusColor(inv.status)}`}>{inv.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDetail;