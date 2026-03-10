'use client';

import { useShadow } from '@/lib/shadow-context';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar } from 'lucide-react';

export function DataBreakdown() {
  const { history } = useShadow();

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Clock className="text-purple-400" />
        <span>Data Timeline</span>
      </h2>

      {history.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p className="text-lg">Your digital footprint is minimal</p>
          <p className="text-sm mt-2">Try the simulations above to see how your data grows</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {history.slice(-10).map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 p-3 bg-slate-900 rounded-lg border border-slate-700"
            >
              <span className={`text-2xl ${event.type === 'add' ? 'text-green-400' : 'text-red-400'}`}>
                {event.type === 'add' ? '➕' : '➖'}
              </span>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-300">{event.source}</div>
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span className="capitalize">{event.category}:</span>
                  <span className={event.type === 'add' ? 'text-green-400' : 'text-red-400'}>
                    {event.type === 'add' ? '+' : ''}{event.amount}%
                  </span>
                </div>
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {event.timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' })} {event.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Stats */}
      {history.length > 0 && (
        <div className="mt-4 p-4 bg-slate-900 rounded-lg border border-slate-700">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-400">{history.length}</div>
              <div className="text-xs text-slate-400">Total Events</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">{history.filter(h => h.type === 'add').length}</div>
              <div className="text-xs text-slate-400">Data Added</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
