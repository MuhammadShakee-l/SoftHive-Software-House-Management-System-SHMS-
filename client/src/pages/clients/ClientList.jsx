import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Search, Edit2, Trash2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchClients, deleteClient } from '../../redux/slices/clientSlice';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import ClientForm from '../../components/clients/ClientForm';
import { getInitials, formatDate } from '../../utils/helpers';
import useAuth from '../../hooks/useAuth';

const ClientList = () => {
  const dispatch = useDispatch();
  const { clients, pagination, isLoading } = useSelector((s) => s.clients);
  const { isAdmin } = useAuth();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editClient, setEditClient] = useState(null);

  useEffect(() => {
    dispatch(fetchClients({ page, limit: 10, search }));
  }, [page, search]);

  const handleDelete = (id) => {
    if (window.confirm('Delete this client? This action cannot be undone.')) {
      dispatch(deleteClient(id));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">{pagination.total || 0} total clients</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setEditClient(null); setModalOpen(true); }} className="btn-primary">
            <Plus className="h-4 w-4" /> Add Client
          </button>
        )}
      </div>

      <div className="card !p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        {isLoading ? <Loader /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr className="text-left text-gray-500 dark:text-gray-400">
                  <th className="px-6 py-4 font-medium">Client</th>
                  <th className="px-6 py-4 font-medium">Company</th>
                  <th className="px-6 py-4 font-medium">Industry</th>
                  <th className="px-6 py-4 font-medium">Projects</th>
                  <th className="px-6 py-4 font-medium">Joined</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {clients.map((client, i) => (
                  <motion.tr
                    key={client._id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {getInitials(client.user?.name)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{client.user?.name}</p>
                          <p className="text-xs text-gray-400">{client.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">{client.companyName}</td>
                    <td className="px-6 py-4 text-gray-500">{client.industry || '—'}</td>
                    <td className="px-6 py-4 text-gray-500">{client.projects?.length || 0}</td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(client.createdAt)}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${client.user?.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {client.user?.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/clients/${client._id}`}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-primary-600 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => { setEditClient(client); setModalOpen(true); }}
                              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-600 transition-colors"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(client._id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {clients.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      No clients found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages}</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40">Prev</button>
              <button disabled={page >= pagination.pages} onClick={() => setPage(page + 1)} className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditClient(null); }}
        title={editClient ? 'Edit Client' : 'Add New Client'}
        size="lg"
      >
        <ClientForm
          client={editClient}
          onSuccess={() => { setModalOpen(false); dispatch(fetchClients({ page, limit: 10 })); }}
        />
      </Modal>
    </div>
  );
};

export default ClientList;