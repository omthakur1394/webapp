export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);

    if ((window as any).Razorpay) {
      return resolve(true);
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface RazorpayCheckoutOptions {
  amount: number; // in INR
  productName: string;
  description?: string;
  userEmail?: string;
  userName?: string;
  userContact?: string;
  onSuccess: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  onFailure?: (error: any) => void;
}

export async function startRazorpayPayment(options: RazorpayCheckoutOptions): Promise<boolean> {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    alert('Failed to load Razorpay payment gateway. Please check your internet connection.');
    return false;
  }

  try {
    const res = await fetch('/api/razorpay/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: options.amount,
        notes: {
          product_name: options.productName,
          customer_name: options.userName || 'Guest',
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Could not initiate payment order');
    }

    const orderData = await res.json();

    const rzpOptions = {
      key: orderData.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_U3CGk80px6Xuqv',
      amount: orderData.amount,
      currency: orderData.currency || 'INR',
      name: 'ShopEase E-Commerce',
      description: `Payment for ${options.productName}`,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80',
      order_id: orderData.order_id,
      handler: async function (response: any) {
        options.onSuccess(response);
      },
      prefill: {
        name: options.userName || '',
        email: options.userEmail || 'customer@shopease.com',
        contact: options.userContact || '9999999999',
      },
      theme: {
        color: '#4f46e5', // indigo-600
      },
      modal: {
        ondismiss: function () {
          if (options.onFailure) {
            options.onFailure(new Error('Payment window closed by user'));
          }
        },
      },
    };

    const rzp = new (window as any).Razorpay(rzpOptions);
    rzp.open();
    return true;
  } catch (err: any) {
    console.error('Razorpay initialization error:', err);
    if (options.onFailure) options.onFailure(err);
    alert(`Payment initialization failed: ${err.message}`);
    return false;
  }
}
