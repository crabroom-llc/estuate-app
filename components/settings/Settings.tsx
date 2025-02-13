import React, { useEffect, useState } from "react";
import { getPaymentMethod, updatePaymentMethod } from "../api/hubspot/userHubspotData";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

const Settings = () => {
    const [savePayment, setSavePayment] = useState(false);
    const [isChanged, setIsChanged] = useState(false);
    const [loadingButton, setLoadingButton] = useState(false);
    const [screenLoading, setScreenLoading] = useState(false);
    const [noUser, setNoUser] = useState(false);

    const handleToggle = () => {
        setSavePayment(!savePayment);
        setIsChanged(true);
    };

    const handleSave = async () => {
        try {
            setLoadingButton(true);
            const savePaymentMethod = savePayment ? "yes" : "no";
            await updatePaymentMethod(savePaymentMethod);
            setIsChanged(false);
            setLoadingButton(false);
        } catch (error) {
            setLoadingButton(false);
            console.log(error);
        }
    };

    const getPaymentMethodValue = async () => {
        try {
            setScreenLoading(true);
            const response = await getPaymentMethod();
            if (response.save_payment_method === "yes") {
                setSavePayment(true);
            } else if (response.save_payment_method === "no") {
                setSavePayment(false);
            } else if (!response.save_payment_method) {
                setNoUser(true);
            }
            setScreenLoading(false);
        } catch (error) {
            setScreenLoading(false);
            console.log(error);
        }
    };

    useEffect(() => {
        getPaymentMethodValue();
    }, []);

    return (
        <div className="flex flex-col items-center justify-start h-[94vh] pt-32 space-y-6 bg-gray-100 p-6 rounded-lg shadow-lg">
            {screenLoading && (
                <div className="fixed inset-0 backdrop-blur-sm z-[9999] flex items-center justify-center text-white">
                    <div className="w-10 h-10 border-4 border-solid border-t-transparent rounded-full border-gray-600 animate-spin"></div>
                </div>
            )}
            <h2 className="text-2xl text-center w-full font-bold text-gray-800">Settings</h2>

            {/* Toggle Section */}
            <div className="flex flex-row items-center space-x-4 w-1/2 justify-between">
                <span className="text-lg font-semibold text-gray-700">Save Payment Method:</span>

                {/* Toggle Switch */}
                <div className="flex flex-row items-center space-x-4 justify-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only" checked={savePayment} onChange={handleToggle} />
                        <div className={`w-12 h-6 bg-gray-300 rounded-full shadow-inner transition ${savePayment ? "bg-green-500" : "bg-gray-400"}`}></div>
                        <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition transform ${savePayment ? "translate-x-6" : ""}`}></span>
                    </label>

                    <span className={`text-lg font-semibold ${savePayment ? "text-green-600" : "text-red-600"}`}>
                        {savePayment ? "Yes" : "No"}
                    </span>
                </div>
            </div>

            {/* Save Button */}
            <button
                className={`px-6 py-2 text-white font-semibold rounded-lg transition ${isChanged ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
                    }`}
                onClick={handleSave}
                disabled={!isChanged}
            >
                Save Settings
                {loadingButton && <Spin indicator={<LoadingOutlined style={{ fontSize: 16, color: "#FFFFFF" }} spin />} className="ml-2" />}
            </button>

            {noUser && (
                <div className="flex flex-col items-center space-y-4">
                    <div className="text-lg font-semibold text-gray-700">
                        No Hubspot Account Found. Please connect your HubSpot account to continue.
                    </div>
                    <button
                        onClick={() => window.location.href = "/authorize"}
                        className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                    >
                        Connect
                    </button>
                </div>
            )}

        </div>
    );
};

export default Settings;
