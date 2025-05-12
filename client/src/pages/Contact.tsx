import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MapPin, Phone, Clock, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Spinner } from '@/components/ui/spinner';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// Define form schema with Zod
const contactFormSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number' }),
  locationId: z.number().optional(),
  message: z.string().min(10, { message: 'Message must be at least 10 characters' }),
  wantsNewsletter: z.boolean().default(false),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const Contact = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // Fetch locations
  const { data: locations, isLoading: isLoadingLocations } = useQuery({
    queryKey: ['/api/locations'],
  });

  // Contact form mutation
  const contactMutation = useMutation({
    mutationFn: async (data: ContactFormValues) => {
      const response = await apiRequest('POST', '/api/contact', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('contactPage.contactForm.success'),
        variant: 'success',
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: t('contactPage.contactForm.error'),
        variant: 'destructive',
      });
    },
  });

  // Form definition
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      message: '',
      wantsNewsletter: false,
    },
  });

  // Form submission handler
  const onSubmit = (data: ContactFormValues) => {
    contactMutation.mutate(data);
  };

  return (
    <>
      {/* Contact Hero */}
      <section className="bg-primary text-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-bold text-3xl md:text-4xl mb-4">{t('contactPage.hero.title')}</h1>
            <p className="text-lg opacity-90 mb-6">{t('contactPage.hero.subtitle')}</p>
          </div>
        </div>
      </section>

      {/* Locations */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-bold text-2xl md:text-3xl text-[#333333] mb-3">{t('contactPage.locations.title')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t('contactPage.locations.subtitle')}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {isLoadingLocations ? (
              // Loading skeleton
              Array(2).fill(0).map((_, index) => (
                <Card key={index} className="bg-gray-50 shadow-sm">
                  <div className="h-56 bg-gray-200"></div>
                  <CardContent className="p-6">
                    <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="space-y-3">
                      <div className="flex">
                        <div className="w-6 h-6 bg-gray-300 rounded-full mr-3"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                      <div className="flex">
                        <div className="w-6 h-6 bg-gray-300 rounded-full mr-3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="flex">
                        <div className="w-6 h-6 bg-gray-300 rounded-full mr-3"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                    <div className="h-10 bg-gray-200 rounded w-1/3 mt-6"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              locations?.map((location: any) => (
                <Card key={location.id} className="bg-gray-50 overflow-hidden shadow-sm">
                  <div className="h-56 bg-gray-200">
                    {/* Google Maps embed would go here */}
                    <div className="w-full h-full flex items-center justify-center bg-gray-300">
                      <span className="text-gray-600">Map of {location.name}</span>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-xl mb-3">{location.name}</h3>
                    <ul className="space-y-3 text-gray-700">
                      <li className="flex">
                        <MapPin className="text-primary mt-1 mr-3 h-5 w-5" />
                        <span>{location.address}, {location.city}</span>
                      </li>
                      <li className="flex">
                        <Phone className="text-primary mt-1 mr-3 h-5 w-5" />
                        <span>{location.phone}</span>
                      </li>
                      <li className="flex">
                        <Clock className="text-primary mt-1 mr-3 h-5 w-5" />
                        <span>{location.openingHours}</span>
                      </li>
                    </ul>
                    <div className="mt-6">
                      <Button className="text-primary hover:text-primary/80" variant="link">
                        {t('contactPage.locations.directions')} <ChevronDown className="ml-1 h-4 w-4 rotate-270" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Card className="bg-primary text-white">
              <CardContent className="p-8">
                <h3 className="font-semibold text-xl mb-6 text-center">{t('contactPage.contactForm.title')}</h3>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">{t('contactPage.contactForm.nameLabel')}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t('contactPage.contactForm.namePlaceholder')}
                                className="bg-white/20 border-white/20 placeholder-white/70 text-white"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">{t('contactPage.contactForm.emailLabel')}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t('contactPage.contactForm.emailPlaceholder')}
                                className="bg-white/20 border-white/20 placeholder-white/70 text-white"
                                {...field}
                              />
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
                            <FormLabel className="text-white">{t('contactPage.contactForm.phoneLabel')}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t('contactPage.contactForm.phonePlaceholder')}
                                className="bg-white/20 border-white/20 placeholder-white/70 text-white"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="locationId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">{t('contactPage.contactForm.locationLabel')}</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              defaultValue={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-white/20 border-white/20 text-white">
                                  <SelectValue placeholder={t('contactPage.contactForm.selectLocation')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {locations?.map((location: any) => (
                                  <SelectItem key={location.id} value={location.id.toString()}>
                                    {location.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">{t('contactPage.contactForm.messageLabel')}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t('contactPage.contactForm.messagePlaceholder')}
                              className="bg-white/20 border-white/20 placeholder-white/70 text-white min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="wantsNewsletter"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="border-white data-[state=checked]:bg-secondary data-[state=checked]:border-secondary"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-normal cursor-pointer">
                              {t('contactPage.contactForm.newsletterLabel')}
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <div className="text-center mt-6">
                      <Button
                        type="submit"
                        className="bg-secondary hover:bg-secondary/90 text-white font-medium py-3 px-8 rounded-md transition-colors"
                        disabled={contactMutation.isPending}
                      >
                        {contactMutation.isPending ? (
                          <>
                            <Spinner className="mr-2 h-4 w-4" />
                            {t('contactPage.contactForm.sending')}
                          </>
                        ) : (
                          t('contactPage.contactForm.sendMessage')
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-bold text-2xl md:text-3xl text-[#333333] mb-3">{t('contactPage.faq.title')}</h2>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {[1, 2, 3].map((item) => (
                <AccordionItem key={item} value={`item-${item}`}>
                  <AccordionTrigger className="text-left font-semibold">
                    {t(`contactPage.faq.questions.${item}.question`)}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {t(`contactPage.faq.questions.${item}.answer`)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-primary rounded-lg p-8 text-center text-white">
            <h2 className="font-bold text-2xl md:text-3xl mb-4">{t('newsletter.title')}</h2>
            <p className="mb-6 opacity-90">{t('newsletter.subtitle')}</p>
            <form className="flex flex-col md:flex-row gap-3 max-w-xl mx-auto">
              <Input 
                type="email" 
                placeholder={t('newsletter.emailPlaceholder')} 
                className="flex-1 p-3 bg-white/20 border-white/20 placeholder-white/70 text-white"
                aria-label={t('newsletter.emailAriaLabel')}
              />
              <Button type="submit" className="bg-secondary hover:bg-secondary/90 text-white">
                {t('newsletter.subscribe')}
              </Button>
            </form>
            <p className="mt-4 text-sm opacity-75">{t('newsletter.privacy')}</p>
          </div>
        </div>
      </section>
    </>
  );
};

export default Contact;
