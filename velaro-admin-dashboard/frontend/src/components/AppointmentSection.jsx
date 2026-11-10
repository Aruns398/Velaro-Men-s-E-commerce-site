import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, User } from 'lucide-react';
import { toast } from 'sonner';

const AppointmentSection = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', date: '', time: '', service: '' });
  const [showPayment, setShowPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: '',
    billingAddress: '',
    city: '',
    zipCode: ''
  });

  const services = {
    wedding: { name: 'Wedding Suit', price: 2000 },
    formal: { name: 'Formal Wear', price: 2000 },
    casual: { name: 'Smart Casual', price: 2000 },
    alterations: { name: 'Alterations', price: 2000 },
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.service || !services[form.service]) {
      toast.error('Please select a valid service');
      return;
    }
    setShowPayment(true);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:5000/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        throw new Error('Failed to book appointment');
      }

      toast.success('Payment successful! Appointment confirmed & saved.');
      setForm({ name: '', email: '', phone: '', date: '', time: '', service: '' });
      setPaymentForm({
        cardNumber: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: '',
        cardholderName: '',
        billingAddress: '',
        city: '',
        zipCode: ''
      });
      setShowPayment(false);
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentChange = (e) => {
    setPaymentForm({ ...paymentForm, [e.target.name]: e.target.value });
  };

  return (
    <section id='appointments' className='py-24 bg-background'>
      <div className='container mx-auto px-4 lg:px-8 max-w-2xl'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className='text-center mb-12'
        >
          <p className='font-body text-xs tracking-[0.3em] text-accent uppercase mb-3'>Private Consultation</p>
          <h2 className='font-display text-3xl md:text-4xl text-foreground mb-4'>Book an Appointment</h2>
          <p className='font-body text-muted-foreground'>
            Schedule a private fitting session with our master tailors.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          onSubmit={handleSubmit}
          className='space-y-5'
        >
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
            <div>
              <label className='font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block'>Full Name</label>
              <div className='relative'>
                <User size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
                <input
                  name='name' value={form.name} onChange={handleChange} required
                  className='w-full bg-muted border border-border pl-10 pr-4 py-3 font-body text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors'
                  placeholder='Tharun'
                />
              </div>
            </div>
            <div>
              <label className='font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block'>Email</label>
              <input
                name='email' type='email' value={form.email} onChange={handleChange} required
                className='w-full bg-muted border border-border px-4 py-3 font-body text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors'
                placeholder='john@email.com'
              />
            </div>
          </div>

          <div>
            <label className='font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block'>Phone</label>
            <input
              name='phone' type='tel' value={form.phone} onChange={handleChange} required
              className='w-full bg-muted border border-border px-4 py-3 font-body text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors'
              placeholder='+1 (555) 000-0000'
            />
          </div>

          <div>
            <label className='font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block'>Service</label>
            <select
              name='service' value={form.service} onChange={handleChange} required
              className='w-full bg-muted border border-border px-4 py-3 font-body text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors appearance-none'
            >
              <option value=''>Select a service</option>
              {Object.entries(services).map(([key, service]) => (
                <option key={key} value={key}>
                  {service.name} (₹2,000 booking fee)
                </option>
              ))}
            </select>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
            <div>
              <label className='font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block'>Preferred Date</label>
              <div className='relative'>
                <Calendar size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
                <input
                  name='date' type='date' value={form.date} onChange={handleChange} required
                  className='w-full bg-muted border border-border pl-10 pr-4 py-3 font-body text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors'
                />
              </div>
            </div>
            <div>
              <label className='font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block'>Preferred Time</label>
              <div className='relative'>
                <Clock size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
                <input
                  name='time' type='time' value={form.time} onChange={handleChange} required
                  className='w-full bg-muted border border-border pl-10 pr-4 py-3 font-body text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors'
                />
              </div>
            </div>
          </div>

          <button
            type='submit'
            className='w-full gold-gradient text-accent-foreground font-body text-sm uppercase tracking-wider py-4 hover:opacity-90 transition-opacity duration-300'
          >
            Book Appointment
          </button>
          <p className='text-xs text-muted-foreground text-center mt-4'>
            ₹2,000 booking fee will be collected at the store upon arrival.
          </p>
        </motion.form>

        <AnimatePresence>
          {showPayment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'
              onClick={() => setShowPayment(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className='bg-card p-8 rounded-lg shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto hide-scrollbar'
                onClick={(e) => e.stopPropagation()}
              >
                <div className='flex justify-between items-center mb-6'>
                  <h3 className='font-display text-2xl text-foreground'>Payment Details</h3>
                  <button
                    onClick={() => setShowPayment(false)}
                    className='text-muted-foreground hover:text-foreground'
                  >
                    
                  </button>
                </div>

                <div className='mb-6 p-4 bg-muted rounded-lg'>
                  <div className='flex justify-between items-center'>
                    <span className='font-body text-sm text-muted-foreground'>Appointment Booking Fee</span>
                    <span className='font-display text-lg text-accent'>₹2,000</span>
                  </div>
                  <div className='flex justify-between items-center mt-2'>
                    <span className='font-body text-sm text-muted-foreground'>Service</span>
                    <span className='font-body text-sm text-foreground'>{services[form.service]?.name}</span>
                  </div>
                </div>

                <form onSubmit={handlePaymentSubmit} className='space-y-4'>
                  <div>
                    <label className='font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block'>Card Number</label>
                    <input
                      name='cardNumber'
                      value={paymentForm.cardNumber}
                      onChange={handlePaymentChange}
                      required
                      placeholder='1234 5678 9012 3456'
                      className='w-full bg-muted border border-border px-4 py-3 font-body text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors'
                    />
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block'>Expiry Month</label>
                      <select
                        name='expiryMonth'
                        value={paymentForm.expiryMonth}
                        onChange={handlePaymentChange}
                        required
                        className='w-full bg-muted border border-border px-4 py-3 font-body text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors'
                      >
                        <option value=''>MM</option>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                            {String(i + 1).padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className='font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block'>Expiry Year</label>
                      <select
                        name='expiryYear'
                        value={paymentForm.expiryYear}
                        onChange={handlePaymentChange}
                        required
                        className='w-full bg-muted border border-border px-4 py-3 font-body text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors'
                      >
                        <option value=''>YYYY</option>
                        {Array.from({ length: 10 }, (_, i) => (
                          <option key={i} value={2026 + i}>
                            {2026 + i}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className='font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block'>CVV</label>
                    <input
                      name='cvv'
                      type='password'
                      value={paymentForm.cvv}
                      onChange={handlePaymentChange}
                      required
                      placeholder='123'
                      maxLength='3'
                      className='w-full bg-muted border border-border px-4 py-3 font-body text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors'
                    />
                  </div>

                  <div>
                    <label className='font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block'>Cardholder Name</label>
                    <input
                      name='cardholderName'
                      value={paymentForm.cardholderName}
                      onChange={handlePaymentChange}
                      required
                      placeholder='John Doe'
                      className='w-full bg-muted border border-border px-4 py-3 font-body text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors'
                    />
                  </div>

                  <div>
                    <label className='font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block'>Billing Address</label>
                    <input
                      name='billingAddress'
                      value={paymentForm.billingAddress}
                      onChange={handlePaymentChange}
                      required
                      placeholder='123 Main Street'
                      className='w-full bg-muted border border-border px-4 py-3 font-body text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors'
                    />
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block'>City</label>
                      <input
                        name='city'
                        value={paymentForm.city}
                        onChange={handlePaymentChange}
                        required
                        placeholder='New York'
                        className='w-full bg-muted border border-border px-4 py-3 font-body text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors'
                      />
                    </div>
                    <div>
                      <label className='font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block'>ZIP Code</label>
                      <input
                        name='zipCode'
                        value={paymentForm.zipCode}
                        onChange={handlePaymentChange}
                        required
                        placeholder='10001'
                        className='w-full bg-muted border border-border px-4 py-3 font-body text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors'
                      />
                    </div>
                  </div>

                  <button
                    type='submit'
                    disabled={isSubmitting}
                    className='w-full gold-gradient text-accent-foreground font-body text-sm uppercase tracking-wider py-4 hover:opacity-90 transition-opacity duration-300 mt-6 disabled:opacity-50'
                  >
                    {isSubmitting ? 'Processing...' : 'Pay ₹2,000'}
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default AppointmentSection;
