import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { InsertAppointment, Location, Service, AppointmentSlot } from '@shared/schema';

export const useAppointment = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  // Fetch locations
  const { 
    data: locations,
    isLoading: isLoadingLocations
  } = useQuery<Location[]>({
    queryKey: ['/api/locations'],
  });

  // Single branch (Abasolo): select it automatically.
  useEffect(() => {
    if (locations?.length === 1 && selectedLocation === null) setSelectedLocation(locations[0].id);
  }, [locations, selectedLocation]);

  // Fetch services
  const {
    data: allServices,
    isLoading: isLoadingServices
  } = useQuery<Service[]>({
    queryKey: ['/api/services'],
  });
  // Walk-in services (frame adjustment) are not bookable.
  const services = allServices?.filter((service) => service.requiresAppointment);

  // /appointments?service=ID (from the service cards) preselects the service.
  useEffect(() => {
    if (!services || selectedService !== null) return;
    const fromUrl = Number(new URLSearchParams(window.location.search).get('service'));
    if (fromUrl && services.some((service) => service.id === fromUrl)) setSelectedService(fromUrl);
  }, [services, selectedService]);

  // Fetch appointment slots based on location and date
  const {
    data: slots,
    isLoading: isLoadingSlots,
    refetch: refetchSlots
  } = useQuery<AppointmentSlot[]>({
    queryKey: ['/api/appointment-slots', { locationId: selectedLocation, date: selectedDate }],
    enabled: !!(selectedLocation && selectedDate),
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: InsertAppointment): Promise<{ id: number; confirmationEmailSent?: boolean }> => {
      const response = await apiRequest('POST', '/api/appointments', appointmentData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('appointmentsPage.confirmation.success.title'),
        description: t('appointmentsPage.confirmation.success.message'),
        variant: 'success',
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/appointment-slots'] });
    },
    onError: (error) => {
      console.error('Appointment creation error:', error);
      toast({
        title: t('appointmentsPage.confirmation.error.title'),
        description: t('appointmentsPage.confirmation.error.message'),
        variant: 'destructive',
      });
    }
  });

  // Handle location selection
  const handleLocationSelect = (locationId: number) => {
    setSelectedLocation(locationId);
    // Reset the dependent selections
    setSelectedDate(null);
    setSelectedSlot(null);
  };

  // Handle service selection
  const handleServiceSelect = (serviceId: number) => {
    setSelectedService(serviceId);
  };

  // Handle date selection
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    refetchSlots();
  };

  // Handle slot selection
  const handleSlotSelect = (slotId: number) => {
    setSelectedSlot(slotId);
  };

  // Create appointment
  const createAppointment = (appointmentData: Omit<InsertAppointment, 'locationId' | 'serviceId' | 'slotId' | 'date' | 'time'>) => {
    if (!selectedLocation || !selectedService || !selectedSlot || !selectedDate) {
      toast({
        title: t('error'),
        description: t('appointmentsPage.confirmation.error.message'),
        variant: 'destructive',
      });
      return;
    }

    // Find the selected slot to get the time
    const slot = slots?.find((s: any) => s.id === selectedSlot);
    if (!slot) {
      toast({
        title: t('error'),
        description: t('appointmentsPage.confirmation.error.message'),
        variant: 'destructive',
      });
      return;
    }

    const appointmentDataComplete: InsertAppointment = {
      ...appointmentData,
      locationId: selectedLocation,
      serviceId: selectedService,
      slotId: selectedSlot,
      date: selectedDate,
      time: slot.startTime,
    };

    createAppointmentMutation.mutate(appointmentDataComplete);
  };

  return {
    locations,
    services,
    slots,
    selectedLocation,
    selectedService,
    selectedDate,
    selectedSlot,
    isLoadingLocations,
    isLoadingServices,
    isLoadingSlots,
    isSubmitting: createAppointmentMutation.isPending,
    handleLocationSelect,
    handleServiceSelect,
    handleDateSelect,
    handleSlotSelect,
    createAppointment,
    createAppointmentSuccess: createAppointmentMutation.isSuccess,
    createAppointmentError: createAppointmentMutation.isError,
    confirmationEmailSent: !!createAppointmentMutation.data?.confirmationEmailSent,
  };
};
