import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { isSlotInPast } from "./seed-data";
import { sendAppointmentEmails } from "./notify";
import { 
  insertAppointmentSchema, 
  insertTestimonialSchema, 
  insertSubscriptionSchema, 
  insertContactMessageSchema 
} from "@shared/schema";
import { ZodError } from "zod";

const parseId = (value: string) => {
  const id = Number.parseInt(value, 10);
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
};

/** Registers the JSON API. Shared by the local server and the Vercel function. */
export function registerApiRoutes(app: Express): void {
  // API routes with prefix /api
  app.get('/api/locations', async (_req: Request, res: Response) => {
    try {
      const locations = await storage.getLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch locations' });
    }
  });

  app.get('/api/locations/:id', async (req: Request, res: Response) => {
    try {
      const location = await storage.getLocation(parseId(req.params.id) ?? 0);
      if (!location) {
        return res.status(404).json({ message: 'Location not found' });
      }
      res.json(location);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch location' });
    }
  });

  app.get('/api/services', async (_req: Request, res: Response) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch services' });
    }
  });

  app.get('/api/services/:id', async (req: Request, res: Response) => {
    try {
      const service = await storage.getService(parseId(req.params.id) ?? 0);
      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }
      res.json(service);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch service' });
    }
  });

  app.get('/api/appointment-slots', async (req: Request, res: Response) => {
    try {
      const locationId = req.query.locationId ? parseInt(req.query.locationId as string) : undefined;
      const date = req.query.date as string | undefined;
      
      const slots = await storage.getAppointmentSlots(locationId, date);
      res.json(slots.filter((slot) => !isSlotInPast(slot)));
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch appointment slots' });
    }
  });

  app.post('/api/appointments', async (req: Request, res: Response) => {
    try {
      const appointmentData = insertAppointmentSchema.parse(req.body);
      
      // Check if the slot exists, is available and belongs to the chosen location
      const slot = await storage.getAppointmentSlot(appointmentData.slotId);
      if (!slot) {
        return res.status(404).json({ message: 'Appointment slot not found' });
      }
      
      if (!slot.isAvailable || isSlotInPast(slot)) {
        return res.status(409).json({ message: 'This appointment slot is no longer available' });
      }

      if (slot.locationId !== appointmentData.locationId) {
        return res.status(400).json({ message: 'The slot does not belong to the selected location' });
      }
      
      // Check if the location exists
      const location = await storage.getLocation(appointmentData.locationId);
      if (!location || !location.isActive) {
        return res.status(404).json({ message: 'Location not found' });
      }
      
      // Check if the service exists
      const service = await storage.getService(appointmentData.serviceId);
      if (!service || !service.isActive) {
        return res.status(404).json({ message: 'Service not found' });
      }
      if (!service.requiresAppointment) {
        return res.status(400).json({ message: 'This service does not need an appointment (walk-in)' });
      }
      
      // Date/time always come from the slot, never from the client payload.
      const appointment = await storage.createAppointment({
        ...appointmentData,
        date: slot.date,
        time: slot.startTime,
      });
      if (!appointment) {
        return res.status(409).json({ message: 'This appointment slot is no longer available' });
      }
      // Awaited (not fire-and-forget): a serverless function can be frozen
      // as soon as it responds. Never fails the booking; 8 s timeout inside.
      const email = await sendAppointmentEmails(appointment, service);
      res.status(201).json({ ...appointment, confirmationEmailSent: email.customer });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Invalid appointment data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create appointment' });
    }
  });

  app.get('/api/frames', async (req: Request, res: Response) => {
    try {
      const filters = {
        style: req.query.style as string | undefined,
        material: req.query.material as string | undefined,
        color: req.query.color as string | undefined
      };
      
      const frames = await storage.getFrames(filters);
      res.json(frames);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch frames' });
    }
  });

  app.get('/api/frames/:id', async (req: Request, res: Response) => {
    try {
      const frame = await storage.getFrame(parseId(req.params.id) ?? 0);
      if (!frame) {
        return res.status(404).json({ message: 'Frame not found' });
      }
      res.json(frame);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch frame' });
    }
  });

  app.get('/api/blog-posts', async (req: Request, res: Response) => {
    try {
      // Public API: drafts are never exposed, whatever the query string says.
      const posts = await storage.getBlogPosts(true);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch blog posts' });
    }
  });

  app.get('/api/blog-posts/:id', async (req: Request, res: Response) => {
    try {
      const post = await storage.getBlogPost(parseId(req.params.id) ?? 0);
      if (!post || !post.isPublished) {
        return res.status(404).json({ message: 'Blog post not found' });
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch blog post' });
    }
  });

  app.get('/api/testimonials', async (req: Request, res: Response) => {
    try {
      // Public API: only moderated testimonials.
      const testimonials = await storage.getTestimonials(true);
      res.json(testimonials);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch testimonials' });
    }
  });

  app.post('/api/testimonials', async (req: Request, res: Response) => {
    try {
      const testimonialData = insertTestimonialSchema.parse(req.body);
      const testimonial = await storage.createTestimonial(testimonialData);
      res.status(201).json(testimonial);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Invalid testimonial data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create testimonial' });
    }
  });

  app.post('/api/subscriptions', async (req: Request, res: Response) => {
    try {
      const subscriptionData = insertSubscriptionSchema.parse(req.body);
      const subscription = await storage.createSubscription(subscriptionData);
      res.status(201).json(subscription);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Invalid subscription data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create subscription' });
    }
  });

  app.post('/api/contact', async (req: Request, res: Response) => {
    try {
      const messageData = insertContactMessageSchema.parse(req.body);
      const message = await storage.createContactMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Invalid contact message data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create contact message' });
    }
  });

  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ message: 'Not found' });
  });
}
