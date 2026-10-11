import { useEffect, useState } from 'react';
import PageHeader from '@/components/brand/PageHeader';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, CheckCircle, Clock, MapPin, User } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { BUSINESS, whatsappUrl } from '@shared/business';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useAppointment } from '@/hooks/use-appointment';
import { formatDate, formatTime, formatDateToString, isValidEmail, isValidPhone, createCalendarEvent } from '@/lib/helpers';

// Define form schema with Zod
const appointmentFormSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number' }),
  isFirstVisit: z.boolean().default(true),
  comments: z.string().optional(),
  wantsReminders: z.boolean().default(true),
  acceptTerms: z.boolean().refine(val => val === true, { message: 'You must accept the terms and privacy policy' })
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

const Appointments = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [date, setDate] = useState<Date>();
  
  const {
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
    isSubmitting,
    handleLocationSelect,
    handleServiceSelect,
    handleDateSelect,
    handleSlotSelect,
    createAppointment,
    createAppointmentSuccess
  } = useAppointment();

  // Form definition
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      isFirstVisit: true,
      comments: '',
      wantsReminders: true,
      acceptTerms: false
    }
  });

  // Form submission handler
  const onSubmit = (data: AppointmentFormValues) => {
    createAppointment({
      name: data.name,
      email: data.email,
      phone: data.phone,
      isFirstVisit: data.isFirstVisit,
      comments: data.comments || '',
      wantsReminders: data.wantsReminders
    });
  };

  // Handle date selection from calendar
  const handleCalendarSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      handleDateSelect(formatDateToString(selectedDate));
    }
  };

  // Move to next step if validation passes
  const goToNextStep = async () => {
    if (step === 1 && !selectedLocation) {
      return; // Don't proceed if no location selected
    }
    
    if (step === 2 && !selectedService) {
      return; // Don't proceed if no service selected
    }
    
    if (step === 3 && !selectedSlot) {
      return; // Don't proceed if no slot selected
    }
    
    if (step === 4) {
      // Validate form before submission
      const isValid = await form.trigger();
      if (!isValid) return;
      
      form.handleSubmit(onSubmit)();
      return;
    }
    
    setStep(current => current + 1);
  };

  // With a single branch there is nothing to choose in step 1: start at 2.
  const singleLocation = locations?.length === 1;
  const firstStep = singleLocation ? 2 : 1;
  useEffect(() => {
    if (singleLocation && step === 1) setStep(2);
  }, [singleLocation, step]);

  // Go back to previous step
  const goToPreviousStep = () => {
    setStep(current => Math.max(firstStep, current - 1));
  };

  // Bookable range: today .. today + 14 days (slots are generated for it).
  const lastBookableDay = new Date();
  lastBookableDay.setDate(lastBookableDay.getDate() + 14);

  // Get the selected location and service objects
  const currentLocation = locations?.find((loc: any) => loc.id === selectedLocation);
  const currentService = services?.find((serv: any) => serv.id === selectedService);
  const currentSlot = slots?.find((slot: any) => slot.id === selectedSlot);

  // Create calendar event details
  const appointmentDetails = {
    title: `${t('common.currentLanguage') === 'es' ? currentService?.nameEs : currentService?.nameEn} - Ópticas Cardani`,
    location: `${BUSINESS.name}, ${BUSINESS.address}, ${BUSINESS.city}`,
    startDate: selectedDate || '',
    startTime: currentSlot?.startTime || '',
    endTime: currentSlot?.endTime || '',
    description: `${t('appointmentsPage.confirmation.success.service')}: ${t('common.currentLanguage') === 'es' ? currentService?.nameEs : currentService?.nameEn}\n${t('appointmentsPage.confirmation.success.location')}: ${currentLocation?.name}`
  };

  // Generate calendar download link
  const calendarUrl = createAppointmentSuccess && appointmentDetails.startDate 
    ? createCalendarEvent(appointmentDetails)
    : '';

  return (
    <>
      <PageHeader title={t('appointmentsPage.hero.title')} subtitle={t('appointmentsPage.hero.subtitle')} />

      {/* Booking Steps */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap justify-between mb-8">
              {[1, 2, 3, 4].map((stepNumber) => (
                <div 
                  key={stepNumber}
                  className={`flex items-center mb-4 ${step === stepNumber ? 'text-primary' : step > stepNumber ? 'text-secondary' : 'text-gray-400'}`}
                >
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                      step === stepNumber 
                        ? 'bg-primary text-white' 
                        : step > stepNumber 
                          ? 'bg-secondary text-white' 
                          : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step > stepNumber ? <CheckCircle size={16} /> : stepNumber}
                  </div>
                  <span className="font-medium">{t(`appointmentsPage.steps.step${stepNumber}`)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Booking Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Step 1: Location Selection */}
            {step === 1 && (
              <div>
                <div className="text-center mb-8">
                  <h2 className="font-bold text-2xl mb-2">{t('appointmentsPage.locationSection.title')}</h2>
                  <p className="text-gray-600">{t('appointmentsPage.locationSection.subtitle')}</p>
                </div>
                
                {isLoadingLocations ? (
                  <div className="flex justify-center my-8">
                    <Spinner className="h-8 w-8 text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {locations?.map((location: any) => (
                      <Card 
                        key={location.id} 
                        className={`cursor-pointer transition-colors ${
                          selectedLocation === location.id 
                            ? 'border-primary' 
                            : 'hover:border-gray-300'
                        }`}
                        onClick={() => handleLocationSelect(location.id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start">
                            <div className={`w-5 h-5 rounded-full border-2 mr-3 mt-1 flex-shrink-0 ${
                              selectedLocation === location.id 
                                ? 'border-primary bg-primary' 
                                : 'border-gray-300'
                            }`} />
                            <div>
                              <h3 className="font-semibold text-lg mb-2">{location.name}</h3>
                              <div className="text-gray-600">
                                <div className="flex items-start mb-1">
                                  <MapPin className="h-4 w-4 mr-2 mt-1 text-primary" />
                                  <span>{location.address}, {location.city}</span>
                                </div>
                                <div className="flex items-start mb-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 mt-1 text-primary" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                  </svg>
                                  <span>{location.phone}</span>
                                </div>
                                <div className="flex items-start">
                                  <Clock className="h-4 w-4 mr-2 mt-1 text-primary" />
                                  <span>{location.openingHours}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Service Selection */}
            {step === 2 && (
              <div>
                <div className="text-center mb-8">
                  <h2 className="font-bold text-2xl mb-2">{t('appointmentsPage.serviceSection.title')}</h2>
                  <p className="text-gray-600">{t('appointmentsPage.serviceSection.subtitle')}</p>
                </div>
                
                {isLoadingServices ? (
                  <div className="flex justify-center my-8">
                    <Spinner className="h-8 w-8 text-primary" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {services?.map((service: any) => (
                      <Card 
                        key={service.id} 
                        className={`cursor-pointer transition-colors ${
                          selectedService === service.id 
                            ? 'border-primary' 
                            : 'hover:border-gray-300'
                        }`}
                        onClick={() => handleServiceSelect(service.id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start">
                            <div className={`w-5 h-5 rounded-full border-2 mr-3 mt-1 flex-shrink-0 ${
                              selectedService === service.id 
                                ? 'border-primary bg-primary' 
                                : 'border-gray-300'
                            }`} />
                            <div className="flex-grow">
                              <div className="flex justify-between items-start">
                                <h3 className="font-semibold text-lg mb-1">
                                  {t('common.currentLanguage') === 'es' ? service.nameEs : service.nameEn}
                                </h3>
                                <div className="text-right">
                                  {/* Prices aren't published (null): show nothing, not "Free". */}
                                  {service.price != null && service.price > 0 ? (
                                    <span className="font-bold">
                                      ${(service.price / 100).toLocaleString('es-MX')}
                                    </span>
                                  ) : service.price === 0 ? (
                                    <span className="text-secondary font-bold">
                                      {t('servicesPage.free')}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                              <p className="text-gray-600 mb-2">
                                {t('common.currentLanguage') === 'es' ? service.descriptionEs : service.descriptionEn}
                              </p>
                              <div className="flex items-center text-sm text-gray-500">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>{t('servicesPage.duration', { minutes: service.durationMinutes })}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Date and Time Selection */}
            {step === 3 && (
              <div>
                <div className="text-center mb-8">
                  <h2 className="font-bold text-2xl mb-2">{t('appointmentsPage.calendarSection.title')}</h2>
                  <p className="text-gray-600">{t('appointmentsPage.calendarSection.subtitle')}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Calendar */}
                  <div>
                    <Card>
                      <CardContent className="p-4">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={handleCalendarSelect}
                          className="rounded-md border"
                          disabled={{ before: new Date(), after: lastBookableDay }}
                        />
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Time slots */}
                  <div>
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-4">{t('appointmentsPage.calendarSection.availableTimes')}</h3>
                        
                        {isLoadingSlots ? (
                          <div className="flex justify-center my-8">
                            <Spinner className="h-8 w-8 text-primary" />
                          </div>
                        ) : selectedDate ? (
                          <>
                            {(slots?.filter((slot: any) => slot.isAvailable).length ?? 0) > 0 ? (
                              <div className="grid grid-cols-3 gap-2">
                                {slots
                                  ?.filter((slot: any) => slot.isAvailable)
                                  .map((slot: any) => (
                                    <Button
                                      key={slot.id}
                                      variant={selectedSlot === slot.id ? "default" : "outline"}
                                      className={selectedSlot === slot.id ? "bg-primary text-white" : ""}
                                      onClick={() => handleSlotSelect(slot.id)}
                                    >
                                      {formatTime(slot.startTime, t('common.currentLanguage'))}
                                    </Button>
                                  ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-center py-4">
                                {t('appointmentsPage.calendarSection.noTimesAvailable')}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-gray-500 text-center py-4">
                            {t('appointmentsPage.calendarSection.noTimesAvailable')}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                    
                    {selectedDate && selectedSlot && (
                      <div className="mt-4">
                        <Alert className="bg-primary/10 border-primary/20">
                          <AlertTitle className="text-primary">
                            {t('common.currentLanguage') === 'es' ? currentService?.nameEs : currentService?.nameEn}
                          </AlertTitle>
                          <AlertDescription className="text-gray-700">
                            {formatDate(selectedDate, t('common.currentLanguage'))} · {formatTime(currentSlot?.startTime ?? '', t('common.currentLanguage'))}
                            <br />
                            {currentLocation?.name}
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Customer Details */}
            {step === 4 && !createAppointmentSuccess && (
              <div>
                <div className="text-center mb-8">
                  <h2 className="font-bold text-2xl mb-2">{t('appointmentsPage.detailsSection.title')}</h2>
                </div>
                
                <Card>
                  <CardContent className="p-6">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('appointmentsPage.detailsSection.nameLabel')}</FormLabel>
                                <FormControl>
                                  <Input placeholder={t('appointmentsPage.detailsSection.namePlaceholder')} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('appointmentsPage.detailsSection.phoneLabel')}</FormLabel>
                                <FormControl>
                                  <Input placeholder={t('appointmentsPage.detailsSection.phonePlaceholder')} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('appointmentsPage.detailsSection.emailLabel')}</FormLabel>
                              <FormControl>
                                <Input placeholder={t('appointmentsPage.detailsSection.emailPlaceholder')} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="isFirstVisit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('appointmentsPage.detailsSection.visitTypeLabel')}</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={(value) => field.onChange(value === 'true')}
                                  defaultValue={field.value ? 'true' : 'false'}
                                  className="flex flex-col space-y-1"
                                >
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="true" />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">
                                      {t('appointmentsPage.detailsSection.firstVisit')}
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="false" />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">
                                      {t('appointmentsPage.detailsSection.returningPatient')}
                                    </FormLabel>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="comments"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('appointmentsPage.detailsSection.commentsLabel')}</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder={t('appointmentsPage.detailsSection.commentsPlaceholder')}
                                  className="min-h-[100px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="wantsReminders"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="font-normal cursor-pointer">
                                  {t('appointmentsPage.detailsSection.remindersLabel')}
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="acceptTerms"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="font-normal cursor-pointer">
                                  {t('appointmentsPage.detailsSection.privacyLabel')}
                                </FormLabel>
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Confirmation Screen */}
            {createAppointmentSuccess && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
                  <CheckCircle className="h-8 w-8 text-secondary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">{t('appointmentsPage.confirmation.success.title')}</h2>
                <p className="text-gray-600 mb-8">{t('appointmentsPage.confirmation.success.message')}</p>
                
                <Card className="max-w-lg mx-auto mb-8">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">{t('appointmentsPage.confirmation.success.details')}</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('appointmentsPage.confirmation.success.service')}:</span>
                        <span className="font-medium">{t('common.currentLanguage') === 'es' ? currentService?.nameEs : currentService?.nameEn}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('appointmentsPage.confirmation.success.location')}:</span>
                        <span className="font-medium">{currentLocation?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('appointmentsPage.confirmation.success.date')}:</span>
                        <span className="font-medium">{formatDate(selectedDate || '', t('common.currentLanguage'))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('appointmentsPage.confirmation.success.time')}:</span>
                        <span className="font-medium">{formatTime(currentSlot?.startTime || '', t('common.currentLanguage'))}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
                  <a
                    href={whatsappUrl(
                      `${t('whatsappBooking.greeting')}\n` +
                      `${t('whatsappBooking.name')}: ${form.getValues('name')}\n` +
                      `${t('appointmentsPage.confirmation.success.service')}: ${t('common.currentLanguage') === 'es' ? currentService?.nameEs : currentService?.nameEn}\n` +
                      `${t('appointmentsPage.confirmation.success.date')}: ${formatDate(selectedDate || '', t('common.currentLanguage'))}\n` +
                      `${t('appointmentsPage.confirmation.success.time')}: ${formatTime(currentSlot?.startTime || '', t('common.currentLanguage'))}\n` +
                      t('whatsappBooking.footer'),
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-whatsapp px-6 py-2 font-semibold text-white shadow transition-colors hover:bg-whatsapp/90"
                  >
                    <FaWhatsapp className="h-5 w-5" aria-hidden="true" />
                    {t('whatsappBooking.confirm')}
                  </a>
                  {calendarUrl && (
                    <a 
                      href={calendarUrl} 
                      download="ópticas-cardani-appointment.ics"
                      className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-6 rounded-md transition-colors inline-flex items-center justify-center"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {t('appointmentsPage.confirmation.success.addToCalendar')}
                    </a>
                  )}
                  <Button variant="outline" asChild>
                    <a href="/">
                      {t('appointmentsPage.confirmation.success.backToHome')}
                    </a>
                  </Button>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            {!createAppointmentSuccess && (
              <div className="flex justify-between mt-8">
                <Button 
                  variant="outline" 
                  onClick={goToPreviousStep}
                  disabled={step <= firstStep || isSubmitting}
                >
                  {t('common.back')}
                </Button>
                
                <Button 
                  onClick={goToNextStep}
                  disabled={
                    (step === 1 && !selectedLocation) ||
                    (step === 2 && !selectedService) ||
                    (step === 3 && !selectedSlot) ||
                    isSubmitting
                  }
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      {t('appointmentsPage.confirmation.processing')}
                    </>
                  ) : step === 4 ? (
                    t('appointmentsPage.confirmation.confirmAppointment')
                  ) : (
                    t('common.continue')
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default Appointments;
