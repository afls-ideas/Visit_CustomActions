import { LightningElement, api } from 'lwc';
import { createRecord } from 'lightning/uiRecordApi';
import { CloseActionScreenEvent } from 'lightning/actions';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class LscMobileQuickActionCaptureExpense extends LightningElement {
    @api recordId; // Visit Id (Visit page) or Account Id (Account action menu)

    @api objectApiName;

    get contextObject() {
        const p = (this.recordId || '').substring(0, 3);
        const byPrefix = { '0Z5': 'Visit', '001': 'Account' };
        return this.objectApiName || byPrefix[p] || 'Unknown';
    }

    get contextRecordId() {
        return this.recordId || '(none - no record context)';
    }

    title = '';
    amount;
    transactionDate = new Date().toISOString().slice(0, 10);
    expenseType = 'Non-Billable';
    description = '';
    isSaving = false;
    errorMessage;

    typeOptions = [
        { label: 'Billable', value: 'Billable' },
        { label: 'Non-Billable', value: 'Non-Billable' }
    ];

    get isVisit() {
        return (this.recordId || '').startsWith('0Z5');
    }

    handleChange(event) {
        this[event.target.name] = event.detail.value;
    }

    handleCancel() {
        this.dispatchEvent(new CloseActionScreenEvent());
    }

    async handleSave() {
        if (this.amount === undefined || this.amount === '' || !this.transactionDate) {
            this.errorMessage = 'Amount and Transaction Date are required.';
            return;
        }
        this.errorMessage = undefined;
        this.isSaving = true;
        try {
            await createRecord({
                apiName: 'Expense',
                fields: {
                    Title: this.title,
                    Amount: Number(this.amount),
                    TransactionDate: this.transactionDate,
                    ExpenseType: this.expenseType,
                    Description: this.description,
                    ...(this.isVisit ? { ExpenseOriginId: this.recordId } : { AccountId: this.recordId })
                }
            });
            this.dispatchEvent(new ShowToastEvent({ title: 'Expense saved', variant: 'success' }));
            this.dispatchEvent(new CloseActionScreenEvent());
        } catch (e) {
            this.errorMessage = e?.body?.message || 'Unable to save the expense.';
        } finally {
            this.isSaving = false;
        }
    }
}
