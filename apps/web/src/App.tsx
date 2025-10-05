import React from "react";
import EconeuraCockpit from "./EconeuraCockpit";
// Conditionally render the Cockpit preview page when ?preview=cockpit is present
import CockpitPreviewPage from "./pages/CockpitPreviewPage";

export default function App(){
	try{
		const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
		if (params && params.get('preview') === 'cockpit'){
			return <CockpitPreviewPage />;
		}
	}catch(_){ /* noop - render default */ }
	return <EconeuraCockpit />;
}
