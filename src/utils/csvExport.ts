import { Order } from '../types';

/**
 * Escapes a cell value for standard CSV compatibility.
 * Handles commas, double quotes, line breaks, and nullish values.
 */
function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Translates status codes into human-readable bookkeeping labels.
 */
function getStatusLabel(status: Order['status']): string {
  switch (status) {
    case 'pending':
      return 'পেন্ডিং / নতুন অর্ডার (Pending)';
    case 'confirmed':
      return 'অনুমোদিত / প্যাকেজিং (Confirmed)';
    case 'delivered':
      return 'ডেলিভারি সম্পন্ন (Delivered)';
    case 'cancelled':
      return 'বাতিলকৃত (Cancelled)';
    default:
      return status;
  }
}

/**
 * Exports an array of customer orders to a UTF-8 BOM CSV file for bookkeeping.
 * The UTF-8 BOM (\uFEFF) ensures Bengali text renders crisply in MS Excel, Google Sheets,
 * LibreOffice, and mobile spreadsheet apps.
 */
export function exportOrdersToCSV(orders: Order[], customFileName?: string): boolean {
  if (!orders || orders.length === 0) {
    return false;
  }

  const headers = [
    'Order ID (অর্ডার নম্বর)',
    'Order Date & Time (অর্ডারের তারিখ ও সময়)',
    'Customer Name (গ্রাহকের নাম)',
    'Customer Phone (গ্রাহকের মোবাইল নম্বর)',
    'Product Title (পণ্যের নাম)',
    'Product ID (পণ্য আইডি)',
    'Quantity (পরিমাণ)',
    'Delivery Charge (ডেলিভারি চার্জ ৳)',
    'Total Payable (সর্বমোট প্রদেয় টাকা ৳)',
    'Payment Method (পেমেন্ট পদ্ধতি)',
    'District / Area (জেলা / এলাকা)',
    'Delivery Address (ডেলিভারির সম্পূর্ণ ঠিকানা)',
    'GPS Latitude (জিপিএস অক্ষাংশ)',
    'GPS Longitude (জিপিএস দ্রাঘিমাংশ)',
    'Google Maps Location Link (গুগল ম্যাপ লিংক)',
    'Order Status (বর্তমান অবস্থা)',
    'Tracking Step (ডেলিভারি ধাপ ১-৪)',
    'Cancellation Reason (বাতিলের কারণ)',
    'Customer Notes (গ্রাহকের বিশেষ নোট)'
  ];

  const rows = orders.map((order) => {
    const formattedDate = order.createdAt
      ? new Date(order.createdAt).toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      : '';

    return [
      escapeCsvCell(order.id),
      escapeCsvCell(formattedDate),
      escapeCsvCell(order.customerName),
      escapeCsvCell(`'${order.customerPhone}`), // Prepend apostrophe so Excel treats phone as string (preserves leading 0)
      escapeCsvCell(order.productTitle),
      escapeCsvCell(order.productId),
      escapeCsvCell(order.quantity),
      escapeCsvCell(order.deliveryCharge),
      escapeCsvCell(order.totalAmount),
      escapeCsvCell('Cash on Delivery (ক্যাশ অন ডেলিভারি)'),
      escapeCsvCell(order.district),
      escapeCsvCell(order.deliveryAddress),
      escapeCsvCell(order.location?.lat ?? ''),
      escapeCsvCell(order.location?.lng ?? ''),
      escapeCsvCell(order.location?.mapUrl ?? (order.location?.lat ? `https://www.google.com/maps?q=${order.location.lat},${order.location.lng}` : '')),
      escapeCsvCell(getStatusLabel(order.status)),
      escapeCsvCell(order.trackingStep ?? 1),
      escapeCsvCell(order.cancelReason ?? ''),
      escapeCsvCell(order.notes ?? '')
    ].join(',');
  });

  // Prepend UTF-8 BOM so spreadsheet apps (especially Excel) recognize Bengali unicode characters properly
  const csvContent = '\uFEFF' + [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');

  try {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    downloadLink.href = url;
    downloadLink.download = customFileName || `marketplaces_customer_orders_${timestamp}.csv`;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Failed to export CSV', error);
    return false;
  }
}
