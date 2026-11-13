import { LightningElement, api } from 'lwc';
import { createRecord } from 'lightning/uiRecordApi';
import { CloseActionScreenEvent } from 'lightning/actions';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import USER_ID from '@salesforce/user/Id';

export default class LscMobileQuickActionCaptureTask extends LightningElement {
    @api recordId; // Visit Id

    @api objectApiName;

    get contextObject() {
        const p = (this.recordId || '').substring(0, 3);
        const byPrefix = { '0Z5': 'Visit', '001': 'Account' };
        return this.objectApiName || byPrefix[p] || 'Unknown';
    }

    get contextRecordId() {
        return this.recordId || '(none - no record context)';
    }

    subject = '';
    dueDate;
    status = 'Not Started';
    priority = 'Normal';
    description = '';
    isSaving = false;
    errorMessage;

    statusOptions = ['Not Started', 'In Progress', 'Completed', 'On Hold'].map((v) => ({ label: v, value: v }));
    priorityOptions = ['High', 'Normal'].map((v) => ({ label: v, value: v }));

    handleChange(event) {
        this[event.target.name] = event.detail.value;
    }

    handleCancel() {
        this.dispatchEvent(new CloseActionScreenEvent());
    }

    async handleSave() {
        if (!this.subject) {
            this.errorMessage = 'Subject is required.';
            return;
        }
        this.errorMessage = undefined;
        this.isSaving = true;
        try {
            await createRecord({
                apiName: 'Task',
                fields: {
                    Subject: this.subject,
                    ActivityDate: this.dueDate || null,
                    Status: this.status,
                    Priority: this.priority,
                    Description: this.description,
                    WhatId: this.recordId,
                    OwnerId: USER_ID
                }
            });
            this.dispatchEvent(new ShowToastEvent({ title: 'Task saved', variant: 'success' }));
            this.dispatchEvent(new CloseActionScreenEvent());
        } catch (e) {
            this.errorMessage = e?.body?.message || 'Unable to save the task.';
        } finally {
            this.isSaving = false;
        }
    }
}
