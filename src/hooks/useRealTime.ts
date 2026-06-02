import useSWR, { mutate } from 'swr';
import { useEffect } from 'react';
import { socket } from '../realtime/socket';
import { reportsApi, complaintsApi, sensorsApi, notificationsApi, logsApi, settingsApi } from '../services/api';
import { Report, SensorDevice, CitizenComplaint, TelemetryLog, SystemSettings } from '../utils/storage';

export function useReports() {
  const { data, error, isLoading } = useSWR<Report[]>('reports', reportsApi.fetch, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  useEffect(() => {
    const handleUpdate = (updatedReports: Report[]) => {
      mutate('reports', updatedReports, false);
      // Keep localStorage in sync for components that read synchronously
      localStorage.setItem('fb_reports', JSON.stringify(updatedReports));
      localStorage.setItem('roadwatch_reports', JSON.stringify(updatedReports));
      window.dispatchEvent(new Event('roadwatch-reports-updated'));
    };

    socket.on('reports:updated', handleUpdate);
    return () => {
      socket.off('reports:updated', handleUpdate);
    };
  }, []);

  return { reports: data || [], error, isLoading };
}

export function useComplaints() {
  const { data, error, isLoading } = useSWR<CitizenComplaint[]>('complaints', complaintsApi.fetch, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  useEffect(() => {
    const handleUpdate = (updatedComplaints: CitizenComplaint[]) => {
      mutate('complaints', updatedComplaints, false);
      // Keep localStorage in sync for components that read synchronously
      localStorage.setItem('fb_complaints', JSON.stringify(updatedComplaints));
      localStorage.setItem('roadwatch_complaints', JSON.stringify(updatedComplaints));
      window.dispatchEvent(new Event('roadwatch-complaints-updated'));
    };

    socket.on('complaints:updated', handleUpdate);
    return () => {
      socket.off('complaints:updated', handleUpdate);
    };
  }, []);

  return { complaints: data || [], error, isLoading };
}

export function useSensors() {
  const { data, error, isLoading } = useSWR<SensorDevice[]>('sensors', sensorsApi.fetch, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  useEffect(() => {
    const handleUpdate = (updatedSensors: SensorDevice[]) => {
      mutate('sensors', updatedSensors, false);
      localStorage.setItem('fb_sensors', JSON.stringify(updatedSensors));
      localStorage.setItem('roadwatch_sensors', JSON.stringify(updatedSensors));
      window.dispatchEvent(new Event('roadwatch-sensors-updated'));
    };

    socket.on('sensors:updated', handleUpdate);
    return () => {
      socket.off('sensors:updated', handleUpdate);
    };
  }, []);

  return { sensors: data || [], error, isLoading };
}

export function useNotifications() {
  const { data, error, isLoading } = useSWR<any[]>('notifications', notificationsApi.fetch, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  useEffect(() => {
    const handleUpdate = (updatedNotifications: any[]) => {
      mutate('notifications', updatedNotifications, false);
      localStorage.setItem('fb_notifications', JSON.stringify(updatedNotifications));
      window.dispatchEvent(new Event('roadwatch-notifications-updated'));
    };

    socket.on('notifications:updated', handleUpdate);
    return () => {
      socket.off('notifications:updated', handleUpdate);
    };
  }, []);

  return { notifications: data || [], error, isLoading };
}

export function useLogs() {
  const { data, error, isLoading } = useSWR<TelemetryLog[]>('logs', logsApi.fetch, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  useEffect(() => {
    const handleUpdate = (updatedLogs: TelemetryLog[]) => {
      mutate('logs', updatedLogs, false);
      localStorage.setItem('roadwatch_logs', JSON.stringify(updatedLogs));
      window.dispatchEvent(new Event('roadwatch-logs-updated'));
    };

    socket.on('logs:updated', handleUpdate);
    return () => {
      socket.off('logs:updated', handleUpdate);
    };
  }, []);

  return { logs: data || [], error, isLoading };
}

export function useSettings() {
  const { data, error, isLoading } = useSWR<SystemSettings>('settings', settingsApi.fetch, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  useEffect(() => {
    const handleUpdate = (updatedSettings: SystemSettings) => {
      mutate('settings', updatedSettings, false);
      localStorage.setItem('roadwatch_settings', JSON.stringify(updatedSettings));
      window.dispatchEvent(new Event('roadwatch-settings-updated'));
    };

    socket.on('settings:updated', handleUpdate);
    return () => {
      socket.off('settings:updated', handleUpdate);
    };
  }, []);

  return { settings: data || null, error, isLoading };
}
