import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, color = 'primary', subtitle, to }) => {
  const colors = {
    primary: 'from-primary-500 to-primary-700',
    green: 'from-emerald-500 to-emerald-700',
    orange: 'from-orange-500 to-orange-700',
    red: 'from-red-500 to-red-700',
    purple: 'from-violet-500 to-violet-700',
    blue: 'from-blue-500 to-blue-700',
  };

  const CardBody = (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      className={`card hover:shadow-lg transition-shadow duration-300 ${to ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1 truncate">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>

        <div className={`p-3 rounded-2xl bg-gradient-to-br ${colors[color]} shadow-md`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  if (to) {
    return (
      <Link to={to} className="block rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500">
        {CardBody}
      </Link>
    );
  }

  return CardBody;
};

export default StatCard;