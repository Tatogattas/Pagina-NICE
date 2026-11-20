import {APIProvider, APIProviderContext} from '@vis.gl/react-google-maps';
import {useContext, type ReactNode} from 'react';
import {getGoogleMapsApiKey} from '../utils/mapsLinks';

const MAPS_LIBRARIES = ['marker', 'places'];

interface MapsApiProviderProps {
  children: ReactNode;
}

export function MapsApiProvider({children}: MapsApiProviderProps) {
  const existingContext = useContext(APIProviderContext);
  const apiKey = getGoogleMapsApiKey();

  if (existingContext || !apiKey) {
    return <>{children}</>;
  }

  return (
    <APIProvider
      apiKey={apiKey}
      language="es"
      region="SV"
      libraries={MAPS_LIBRARIES}
    >
      {children}
    </APIProvider>
  );
}
