import React, { useState, useEffect } from 'react';
import { Cpu, Droplets, Battery, Wifi, AlertTriangle, CheckCircle2, RefreshCw, MapPin, Activity } from 'lucide-react';
import { getSensors, saveSensors, SensorDevice } from '../utils/storage';

export function SensorNetwork() {
  const [sensors, setSensors] = useState<SensorDevice[]>(() => getSensors());
  const [selectedSensorId, setSelectedSensorId] = useState<string>('sns-01');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync from central storage event bus
  useEffect(() => {
    const handleSync = () => {
      setSensors(getSensors());
    };
    window.addEventListener('roadwatch-sensors-updated', handleSync);
    return () => {
      window.removeEventListener('roadwatch-sensors-updated', handleSync);
    };
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Simulate telemetry updates
      const updated = getSensors().map(s => {
        if (s.status === 'Offline') return s;
        // Wiggle the values
        const vibrationDelta = (Math.random() - 0.5) * 4;
        const tempDelta = (Math.random() - 0.5) * 1.5;
        const batDelta = Math.random() > 0.8 ? -1 : 0;
        
        return {
          ...s,
          vibration: Math.max(1, Math.round(s.vibration + vibrationDelta)),
          temperature: parseFloat((s.temperature + tempDelta).toFixed(1)),
          battery: Math.max(1, s.battery + batDelta)
        };
      });
      saveSensors(updated);
      setSensors(updated);
      setIsRefreshing(false);
    }, 1000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Online':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'Warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Online':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Warning':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  const selectedSensor = sensors.find(s => s.id === selectedSensorId) || sensors[0];

  // Draw a beautiful custom vibration waveform path dynamically
  const generateWaveformPath = (vibrationVal: number) => {
    // Generate sine wave path matching current vibration frequency/amplitude
    const width = 500;
    const height = 100;
    const segments = 40;
    let path = `M 0 ${height / 2}`;
    
    for (let i = 1; i <= segments; i++) {
      const x = (i / segments) * width;
      const amplitude = vibrationVal > 40 ? 30 : vibrationVal > 15 ? 15 : 6;
      const frequency = vibrationVal > 40 ? 5 : vibrationVal > 15 ? 2.5 : 1;
      const y = (height / 2) + Math.sin(i * frequency) * amplitude * (i % 2 === 0 ? 1 : -1);
      path += ` L ${x} ${y}`;
    }
    return path;
  };

  return (
    <div className="p-8 max-w-[1440px] mx-auto pb-32 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-primary tracking-tight">IoT Sensor Network</h2>
          <p className="text-text-secondary mt-1">Live telemetry monitoring for ESP32 accelerometer and temperature sensors.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="bg-primary hover:bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg text-xs transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Pulling Telemetry...' : 'Refresh Nodes'}</span>
        </button>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-border-subtle shadow-sm">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">ESP32 Nodes Online</span>
          <div className="text-3xl font-bold text-primary mt-1.5">
            {sensors.filter(s => s.status === 'Online').length} <span className="text-sm text-text-secondary">/ 5</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-border-subtle shadow-sm">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Active Warnings</span>
          <div className={`text-3xl font-bold mt-1.5 ${sensors.some(s => s.status === 'Warning') ? 'text-amber-600 animate-pulse' : 'text-primary'}`}>
            {sensors.filter(s => s.status === 'Warning').length} Active
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-border-subtle shadow-sm">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Average Battery</span>
          <div className="text-3xl font-bold text-primary mt-1.5">
            {Math.round(sensors.reduce((acc, curr) => acc + curr.battery, 0) / sensors.length)}%
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-border-subtle shadow-sm">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Primary Connectivity</span>
          <div className="text-xl font-bold text-primary mt-2">
            WiFi / LoRaWAN
          </div>
        </div>
      </div>

      {/* Main split dashboard layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Interactive Map & Live Waveform Panel */}
        <section className="lg:col-span-8 space-y-8">
          
          {/* Live Waveform Chart */}
          <div className="bg-white rounded-xl border border-border-subtle p-6 shadow-sm">
            <div className="flex justify-between items-center border-b border-border-subtle/50 pb-3 mb-4">
              <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                <Activity className="w-4.5 h-4.5 text-primary" /> Waveform Telemetry: {selectedSensor.name}
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(selectedSensor.status)}`}>
                {selectedSensor.status}
              </span>
            </div>

            {selectedSensor.status === 'Offline' ? (
              <div className="h-[140px] flex items-center justify-center text-text-secondary/60 bg-slate-50 border border-border-subtle rounded-xl text-xs font-semibold">
                ⚠️ Telemetry Offline. Node connection failed.
              </div>
            ) : (
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 flex flex-col justify-between h-[150px]">
                {/* Waveform graphic */}
                <svg viewBox="0 0 500 100" className="w-full h-full">
                  <path 
                    d={generateWaveformPath(selectedSensor.vibration)}
                    fill="none" 
                    stroke={selectedSensor.status === 'Warning' ? '#F59E0B' : '#10B981'} 
                    strokeWidth="2.5" 
                    className="transition-all duration-300"
                  />
                  <line x1="0" y1="50" x2="500" y2="50" stroke="#1F2937" strokeWidth="1" strokeDasharray="3,3" />
                </svg>

                <div className="flex justify-between text-[9px] font-bold text-gray-500 uppercase">
                  <span>-100ms</span>
                  <span>-50ms</span>
                  <span>Live telemetry stream</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="p-3 bg-slate-50 border border-border-subtle rounded-xl text-center">
                <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider block">Vibration Amplitude</span>
                <span className={`text-base font-black mt-1.5 block ${selectedSensor.vibration > 40 ? 'text-amber-600' : 'text-primary'}`}>
                  {selectedSensor.vibration} Hz
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-border-subtle rounded-xl text-center">
                <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider block">Surface Temp</span>
                <span className="text-base font-black mt-1.5 block text-primary">
                  {selectedSensor.temperature}°C
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-border-subtle rounded-xl text-center">
                <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider block">Battery Level</span>
                <span className="text-base font-black mt-1.5 block text-primary flex items-center justify-center gap-1">
                  <Battery className="w-4.5 h-4.5 text-primary" /> {selectedSensor.battery}%
                </span>
              </div>
            </div>
          </div>

          {/* Sensor Node coordinates plotting overlay */}
          <div className="bg-white rounded-xl border border-border-subtle p-6 shadow-sm">
            <h3 className="font-bold text-sm text-primary flex items-center gap-2 border-b border-border-subtle/50 pb-3 mb-4">
              <MapPin className="w-4 h-4 text-primary" /> Node Placement GPS Grid
            </h3>
            
            <div className="relative aspect-video rounded-xl bg-slate-900 overflow-hidden border border-slate-800">
              <img 
                className="w-full h-full object-cover opacity-15 grayscale select-none" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAuHFT25LrIudFzN9hASHnRgcA8BFks14OkKHmCUQHsIgxP3_efPdHHmYslWisBVEx-kYPAL-txAPhVyEdBWysgahj1JzAnfyT5ZDTy2s0D9OlsRCR4Ptdllch1EeRvlylM3nqORXTkFaZrifD2-giS6p6l0A1aYfo-GaksLZgNQ4RGx2i2L8P3hRQddcA-WQqfF6xLKPU35tm4cCYL8xEECIOHkl-TNtw2HmoENL3JBWVs9vbh25GB2z1RhXII3CXQ_qhCdGJn7lo" 
                alt="Placement map"
              />
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>

              {/* Plot sensors */}
              {sensors.map((sns) => {
                const isSelected = sns.id === selectedSensorId;
                const isWarning = sns.status === 'Warning';
                const isOffline = sns.status === 'Offline';
                const color = isOffline ? 'bg-red-500' : isWarning ? 'bg-amber-500 animate-pulse' : 'bg-green-500';
                
                return (
                  <div
                    key={sns.id}
                    onClick={() => setSelectedSensorId(sns.id)}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                      isSelected ? 'scale-130 z-30' : 'hover:scale-115'
                    }`}
                    style={{ top: `${sns.y}%`, left: `${sns.x}%` }}
                    title={sns.name}
                  >
                    <div className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-xl ${color}`}>
                      {sns.id.split('-')[1]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right Side: Sensor Node List */}
        <section className="lg:col-span-4 space-y-3">
          <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest pl-1">Edge Devices</h3>
          
          <div className="space-y-3">
            {sensors.map((sns) => {
              const isSelected = sns.id === selectedSensorId;
              const hasAlert = sns.status === 'Warning';
              return (
                <div
                  key={sns.id}
                  onClick={() => setSelectedSensorId(sns.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 group ${
                    isSelected 
                      ? 'bg-primary text-white border-primary shadow-md' 
                      : 'bg-white border-border-subtle hover:border-primary text-primary hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2.5 items-center">
                      <Cpu className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-white' : 'text-primary'}`} />
                      <div>
                        <h4 className="font-bold text-xs leading-none">{sns.name}</h4>
                        <span className={`text-[9px] mt-1.5 block font-semibold ${isSelected ? 'text-white/70' : 'text-text-secondary'}`}>
                          📍 {sns.locationName}
                        </span>
                      </div>
                    </div>
                    {getStatusIcon(sns.status)}
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-bold border-t border-border-subtle/20 pt-2.5">
                    <span className="flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5" /> {sns.vibration} Hz
                    </span>
                    <span className="flex items-center gap-1">
                      <Wifi className="w-3.5 h-3.5" /> {sns.connectivity}
                    </span>
                    <span className="flex items-center gap-1">
                      <Battery className="w-3.5 h-3.5" /> {sns.battery}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}
