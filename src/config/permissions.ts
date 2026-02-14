import { AppRole } from '@/types';

/**
 * Billing Module Permissions Configuration
 * Defines what actions each role can perform in the billing module.
 */

export type BillingPermission =
    | 'view_invoices'
    | 'create_invoice'
    | 'update_invoice_status'
    | 'download_invoice'
    | 'view_invoice_details'
    | 'refund_invoice';

export const BILLING_PERMISSIONS: Record<AppRole, BillingPermission[]> = {
    admin: [
        'view_invoices',
        'create_invoice',
        'update_invoice_status',
        'download_invoice',
        'view_invoice_details',
        'refund_invoice',
    ],
    receptionist: [
        'view_invoices',
        'create_invoice',
        'update_invoice_status',
        'download_invoice',
        'view_invoice_details',
    ],
    doctor: ['view_invoices', 'view_invoice_details'],

    pharmacist: ['view_invoices', 'view_invoice_details', 'create_invoice'],
    lab_technician: ['view_invoices', 'view_invoice_details'],
    patient: ['view_invoices', 'view_invoice_details', 'download_invoice'],
};
