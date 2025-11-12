import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, TrendingUp, DollarSign, Home, Mail, RefreshCw, Settings, X } from 'lucide-react';

const PropertyAnalyzer = () => {
  const [properties, setProperties] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [stats, setStats] = useState({ total: 0, goodDeals: 0, alertsSent: 0 });
  
  const [config, setConfig] = useState({
    maxPrice: 500000,
    minRentRatio: 1.0,
    minCashFlow: 200,
    targetCities: ['Austin, TX', 'Phoenix, AZ', 'Dallas, TX'],
    analysisType: 'rental',
    downPaymentPercent: 20,
    interestRate: 7.5,
    propertyTaxRate: 1.2,
    insuranceMonthly: 150,
    maintenancePercent: 1,
    vacancyRate: 8,
    propertyManagementPercent: 10
  });

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const scanProperties = async () => {
    setAnalyzing(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/scan-properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      });

      if (!response.ok) throw new Error('Failed to scan properties');
      
      const data = await response.json();
      setProperties(data.properties || []);
      setStats(data.stats || { total: 0, goodDeals: 0, alertsSent: 0 });
      setLastScan(new Date());
    } catch (err) {
      setError(err.message);
      console.error('Error scanning properties:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    scanProperties();
    const interval = setInterval(scanProperties, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${value.toFixed(2)}%`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Property Investment Analyzer</h1>
                <p className="text-sm text-gray-500">Automated deal finder powered by RentCast</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={scanProperties}
                disabled={analyzing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
                <span>{analyzing ? 'Scanning...' : 'Scan Now'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Investment Criteria</h2>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
                  <input
                    type="number"
                    value={config.maxPrice}
                    onChange={(e) => setConfig({...config, maxPrice: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Analysis Type</label>
                  <select
                    value={config.analysisType}
                    onChange={(e) => setConfig({...config, analysisType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="rental">Rental</option>
                    <option value="flip">Flip</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Rent Ratio (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={config.minRentRatio}
                    onChange={(e) => setConfig({...config, minRentRatio: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Cash Flow</label>
                  <input
                    type="number"
                    value={config.minCashFlow}
                    onChange={(e) => setConfig({...config, minCashFlow: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Down Payment (%)</label>
                  <input
                    type="number"
                    value={config.downPaymentPercent}
                    onChange={(e) => setConfig({...config, downPaymentPercent: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={config.interestRate}
                    onChange={(e) => setConfig({...config, interestRate: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Cities (comma-separated)</label>
                <textarea
                  value={config.targetCities.join(', ')}
                  onChange={(e) => setConfig({...config, targetCities: e.target.value.split(',').map(c => c.trim())})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => { setShowSettings(false); scanProperties(); }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save & Scan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Properties Scanned</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Home className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Good Deals Found</p>
                <p className="text-2xl font-bold text-green-600">{stats.goodDeals}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Alerts Sent</p>
                <p className="text-2xl font-bold text-purple-600">{stats.alertsSent}</p>
              </div>
              <Mail className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Last Scan</p>
                <p className="text-sm font-medium text-gray-900">
                  {lastScan ? lastScan.toLocaleTimeString() : 'Never'}
                </p>
              </div>
              <RefreshCw className="w-8 h-8 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Properties List */}
        <div className="space-y-4">
          {properties.length === 0 && !analyzing && (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
              <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No properties found yet. Click "Scan Now" to start.</p>
            </div>
          )}

          {properties.map((property, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{property.address}</h3>
                    <p className="text-sm text-gray-600">{property.city}, {property.state} {property.zipCode}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-full font-bold ${getScoreColor(property.score)}`}>
                    Score: {property.score}/100
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Price</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(property.price)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Est. Rent</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(property.estimatedRent)}/mo</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Cash Flow</p>
                    <p className={`text-lg font-bold ${property.cashFlow > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(property.cashFlow)}/mo
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Cap Rate</p>
                    <p className="text-lg font-bold text-blue-600">{formatPercent(property.capRate)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-600">Beds/Baths</p>
                    <p className="text-sm font-medium text-gray-900">{property.bedrooms} / {property.bathrooms}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Square Feet</p>
                    <p className="text-sm font-medium text-gray-900">{property.squareFeet?.toLocaleString() || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Rent Ratio</p>
                    <p className="text-sm font-medium text-gray-900">{formatPercent(property.rentRatio)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">ROI</p>
                    <p className="text-sm font-medium text-gray-900">{formatPercent(property.roi)}</p>
                  </div>
                </div>

                {property.isGoodDeal && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-sm font-medium text-green-900">Email alert sent!</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default PropertyAnalyzer;