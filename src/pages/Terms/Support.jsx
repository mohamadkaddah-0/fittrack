import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import './Terms.css';

// Remove the TawkTo import line - we'll use the global window object instead

const Support = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    message: '',
    priority: 'normal'
  });
  
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [tawkLoaded, setTawkLoaded] = useState(false);

  // Load Tawk.to script dynamically
  useEffect(() => {
    // Check if script is already loaded
    if (window.Tawk_API) {
      setTawkLoaded(true);
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://embed.tawk.to/69bc6eedfeeaaa1c3e0d2f03/1jk412klp'; // Replace with your actual Tawk.to credentials
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');
    
    // Handle script load
    script.onload = () => {
      console.log('Tawk.to script loaded');
      setTawkLoaded(true);
      
      // Set visitor info if available
      if (window.Tawk_API && (formData.name || formData.email)) {
        window.Tawk_API.setAttributes({
          name: formData.name || 'Visitor',
          email: formData.email || '',
        });
      }
    };
    
    script.onerror = () => {
      console.error('Failed to load Tawk.to script');
    };
    
    // Add script to document
    document.body.appendChild(script);
    
    // Cleanup
    return () => {
      // Remove script if component unmounts
      const existingScript = document.querySelector(`script[src="${script.src}"]`);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []); // Empty dependency array - run once on mount

  // Update Tawk.to when form data changes
  useEffect(() => {
    if (window.Tawk_API && window.Tawk_API.visitor && (formData.name || formData.email)) {
      window.Tawk_API.setAttributes({
        name: formData.name || 'Visitor',
        email: formData.email || '',
      });
    }
  }, [formData.name, formData.email]);

  const handleLiveChat = () => {
    if (window.Tawk_API) {
      window.Tawk_API.maximize();
    } else {
      alert('Chat is loading. Please try again in a moment or use email support.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSending(true);
    
    // Send email using EmailJS
    emailjs.send(
      'YOUR_SERVICE_ID',      // Replace with your actual Service ID from EmailJS
      'YOUR_TEMPLATE_ID',     // Replace with your actual Template ID from EmailJS
      {
        to_email: 'mohammad.moghnieh@lau.edu',
        from_name: formData.name,
        from_email: formData.email,
        subject: formData.subject,
        category: formData.category,
        priority: formData.priority,
        message: formData.message,
        reply_to: formData.email
      },
      'YOUR_PUBLIC_KEY'       // Replace with your actual Public Key from EmailJS
    ).then(() => {
      setFormSubmitted(true);
      setIsSending(false);
      
      // Also update Tawk.to with this info
      if (window.Tawk_API) {
        window.Tawk_API.setAttributes({
          name: formData.name,
          email: formData.email,
          lastContact: new Date().toISOString()
        });
      }
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setFormSubmitted(false);
        setFormData({
          name: '',
          email: '',
          subject: '',
          category: 'general',
          message: '',
          priority: 'normal'
        });
      }, 3000);
    }).catch((error) => {
      console.error('Failed to send email:', error);
      alert('Failed to send message. Please try again or email directly at mohammad.moghnieh@lau.edu');
      setIsSending(false);
    });
  };

  const faqs = [
    {
      question: "How do I reset my password?",
      answer: "Go to the login page and click 'Forgot Password'. Enter your email address and we'll send you a reset link. Follow the instructions in the email to create a new password."
    },
    {
      question: "How do I track my workouts?",
      answer: "Once logged in, navigate to the Dashboard. Click 'Log Workout' and enter your exercise details including duration, intensity, and type. Your progress will be automatically saved and displayed in your statistics."
    },
    {
      question: "Can I export my fitness data?",
      answer: "Yes! Go to Settings > Data Export. You can download your workout history, progress charts, and personal statistics in CSV or PDF format for your records."
    },
    {
      question: "How accurate are the calorie calculations?",
      answer: "Our calorie calculations are based on established metabolic formulas (Mifflin-St Jeor equation) and take into account your age, weight, height, and activity level. They provide a reliable estimate, but individual results may vary."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use industry-standard encryption (256-bit SSL) to protect your data. Your personal information is never shared with third parties without your explicit consent. Read our Privacy Policy for more details."
    },
    {
      question: "How do I cancel my subscription?",
      answer: "To cancel your subscription, go to Settings > Subscription & Billing. Click 'Cancel Subscription' and follow the prompts. Your subscription will remain active until the end of the current billing period."
    }
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  // Professional SVG Icons
  const ChatIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const EmailIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const PhoneIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7294C21.7209 20.9845 21.5573 21.2136 21.3521 21.4019C21.1468 21.5901 20.9046 21.7335 20.6407 21.8227C20.3769 21.9119 20.0974 21.9451 19.82 21.92C16.7428 21.5856 13.787 20.5341 11.19 18.85C8.77376 17.3147 6.72528 15.2662 5.19 12.85C3.49993 10.2412 2.44823 7.27099 2.12 4.18C2.09495 3.90347 2.12786 3.62476 2.21673 3.36158C2.3056 3.0984 2.44834 2.85662 2.63584 2.65147C2.82334 2.44632 3.05131 2.28252 3.3051 2.17033C3.55889 2.05814 3.83294 2.00023 4.11 2.00001H7.11C7.5953 1.99523 8.06578 2.16708 8.43376 2.48353C8.80173 2.79999 9.04209 3.23845 9.11 3.72001C9.23663 4.68006 9.47138 5.62273 9.81 6.53001C9.94454 6.88792 9.97363 7.27691 9.89392 7.65088C9.81421 8.02485 9.62925 8.36811 9.36 8.64001L8.09 9.91001C9.51355 12.4135 11.5865 14.4865 14.09 15.91L15.36 14.64C15.6319 14.3708 15.9752 14.1858 16.3491 14.1061C16.7231 14.0264 17.1121 14.0555 17.47 14.19C18.3773 14.5286 19.32 14.7634 20.28 14.89C20.766 14.9585 21.2079 15.2032 21.5246 15.5775C21.8414 15.9518 22.0093 16.4296 22 16.92Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <section className="legal-section">
      <div className="legal-card support-card">
        <div className="legal-ghost">//</div>
        
        <div className="legal-header">
          <div className="legal-code">24/7 ASSISTANCE</div>
          <div className="legal-title">
            customer
            <em>support</em>
          </div>
        </div>

        <div className="legal-body">
          {/* Quick Contact Options */}
          <div className="support-quick-options">
            <div className="quick-option">
              <div className="quick-option-icon"><ChatIcon /></div>
              <h4>Live Chat</h4>
              <p>24/7 Live Chat {!tawkLoaded && '(Loading...)'}</p>
              <button 
                className="quick-option-btn" 
                onClick={handleLiveChat}
                disabled={!tawkLoaded}
              >
                {tawkLoaded ? 'Start Chat' : 'Loading...'}
              </button>
            </div>
            <div className="quick-option">
              <div className="quick-option-icon"><EmailIcon /></div>
              <h4>Email Support</h4>
              <p>mohammad.moghnieh@lau.edu</p>
              <button className="quick-option-btn" onClick={() => window.location.href = 'mailto:mohammad.moghnieh@lau.edu'}>
                Send Email
              </button>
            </div>
            <div className="quick-option">
              <div className="quick-option-icon"><PhoneIcon /></div>
              <h4>Phone Support</h4>
              <p>(+961) 70777487</p>
              <button className="quick-option-btn" onClick={() => window.location.href = 'tel:+96170777487'}>
                Call Now
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="support-search">
            <input
              type="text"
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="support-search-input"
            />
            <span className="support-search-icon">🔍</span>
          </div>

          {/* FAQ Section */}
          <div className="support-faq">
            <h3>Frequently Asked Questions</h3>
            <div className="faq-list">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, index) => (
                  <div key={index} className="faq-item">
                    <button
                      className={`faq-question ${expandedFaq === index ? 'expanded' : ''}`}
                      onClick={() => toggleFaq(index)}
                    >
                      <span>{faq.question}</span>
                      <span className="faq-icon">{expandedFaq === index ? '−' : '+'}</span>
                    </button>
                    {expandedFaq === index && (
                      <div className="faq-answer">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="no-results">No results found for "{searchQuery}"</p>
              )}
            </div>
          </div>

          {/* System Status */}
          <div className="support-status">
            <h3>System Status</h3>
            <div className="status-items">
              <div className="status-item">
                <span className="status-name">Web App</span>
                <span className="status-badge operational">Operational</span>
              </div>
              <div className="status-item">
                <span className="status-name">Email Support</span>
                <span className="status-badge operational">Operational</span>
              </div>
              <div className="status-item">
                <span className="status-name">Mobile App</span>
                <span className="status-badge operational">Operational</span>
              </div>
            </div>
          </div>

          <div className="legal-footer">
            <Link to="/register" className="legal-back-btn">← Back</Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Support;
