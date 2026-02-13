import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, TrendingDown, Search, RefreshCw, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PullToRefresh from '@/components/common/PullToRefresh';

export default function MarketPrices() {
  const [prices, setPrices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('all');

  const fetchPrices = useCallback(async () => {
    setIsLoading(true);

    const priceData = await base44.integrations.Core.InvokeLLM({
      prompt: `Provide current mandi (agricultural market) prices for major crops in India.
      Include 15 popular crops with realistic market prices.
      
      For each crop include:
      - Crop name
      - Current price per quintal in INR
      - Price change percentage (can be positive or negative)
      - Market/Mandi name
      - State
      
      Base prices on current Indian agricultural market conditions.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          prices: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                crop: { type: 'string' },
                price: { type: 'number' },
                change: { type: 'number' },
                market: { type: 'string' },
                state: { type: 'string' },
              },
            },
          },
          lastUpdated: { type: 'string' },
        },
      },
    });

    setPrices(priceData.prices || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const handleRefresh = async () => {
    await fetchPrices();
  };

  const filteredPrices = prices.filter((item) => {
    const matchesSearch = item.crop.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = selectedState === 'all' || item.state === selectedState;
    return matchesSearch && matchesState;
  });

  const states = [...new Set(prices.map((p) => p.state))].filter(Boolean);

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen bg-gradient-to-br from-gray-50 to-cyan-50/30 dark:from-gray-950 dark:to-cyan-950/30">
      {/* Header */}
      <div 
        className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-xl select-none dark:text-white dark:hover:bg-gray-800">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-semibold text-gray-900 dark:text-white">Market Prices</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Live mandi prices</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPrices}
            disabled={isLoading}
            className="rounded-xl select-none dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Filters */}
        <Card className="p-4 rounded-2xl border-0 shadow-sm dark:bg-gray-900">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search crops..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="w-full sm:w-48 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                <SelectItem value="all">All States</SelectItem>
                {states.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Price List */}
        {isLoading ? (
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-cyan-600 dark:text-cyan-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Fetching latest prices...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPrices.map((item, index) => (
              <motion.div
                key={`${item.crop}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="p-4 rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow dark:bg-gray-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/50 dark:to-green-900/50 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">🌾</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{item.crop}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.market}, {item.state}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        ₹{item.price?.toLocaleString()}
                      </p>
                      <div className={`flex items-center justify-end gap-1 text-sm ${
                        item.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {item.change >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span>{Math.abs(item.change)}%</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}

            {filteredPrices.length === 0 && (
              <Card className="p-8 rounded-2xl border-0 shadow-sm text-center dark:bg-gray-900">
                <p className="text-gray-500 dark:text-gray-400">No crops found matching your search</p>
              </Card>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <Card className="p-4 rounded-2xl border-0 shadow-sm bg-gray-50 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            ⚠️ Prices are indicative and may vary based on quality, quantity, and local market conditions. 
            Please verify with your local mandi before making decisions.
          </p>
        </Card>
      </div>
    </PullToRefresh>
  );
}