import React, { useState } from 'react';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ChangeConfirmationModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    changes = {}, // added default value
    title = "Confirm Changes",
    confirmText = "Save Changes",
    cancelText = "Back to Editing"
}) => {
    const [changeReason, setChangeReason] = useState('');
    const [reasonError, setReasonError] = useState('');

    const formatValue = (value) => {
        if (value === null || value === undefined) return 'None';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    };

    const handleConfirm = () => {
        if (!changeReason.trim()) {
            setReasonError('Please provide a reason for these changes');
            return;
        }
        setReasonError('');
        onConfirm(changeReason.trim());
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                                    <button
                                        type="button"
                                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">Close</span>
                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" aria-hidden="true" />
                                    </div>
                                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                        <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                                            {title}
                                        </Dialog.Title>
                                        <div className="mt-4 max-h-[400px] overflow-y-auto">
                                            {/* Change Reason Input */}
                                            <div className="mb-4">
                                                <label htmlFor="change-reason" className="block text-sm font-medium text-gray-700 mb-1">
                                                    Reason for Changes
                                                </label>
                                                <textarea
                                                    id="change-reason"
                                                    name="change-reason"
                                                    rows={2}
                                                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                                                        reasonError ? 'border-red-300' : ''
                                                    }`}
                                                    placeholder="Please explain why you are making these changes..."
                                                    value={changeReason}
                                                    onChange={(e) => {
                                                        setChangeReason(e.target.value);
                                                        if (e.target.value.trim()) {
                                                            setReasonError('');
                                                        }
                                                    }}
                                                />
                                                {reasonError && (
                                                    <p className="mt-1 text-sm text-red-600">
                                                        {reasonError}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Changes Table */}
                                            {changes && Object.entries(changes).length > 0 && (
                                                <div className="rounded-lg border border-gray-200">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Old Value</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Value</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {Object.entries(changes).map(([field, { old: oldValue, new: newValue }]) => (
                                                                <tr key={field}>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{field}</td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatValue(oldValue)}</td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatValue(newValue)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="button"
                                        className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
                                        onClick={handleConfirm}
                                    >
                                        {confirmText}
                                    </button>
                                    <button
                                        type="button"
                                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                                        onClick={onClose}
                                    >
                                        {cancelText}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};

export default ChangeConfirmationModal;
