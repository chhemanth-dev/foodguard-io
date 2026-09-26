# Connect and deploy the physical detector

## Build
- Add secure cloud storage for the latest ESP32-S3 sensor readings.
- Create a public device endpoint that accepts only validated temperature, humidity, pressure, VOC, and device identifiers.
- Protect device submissions with a shared secret entered securely by the owner.
- Update the dashboard to prefer live readings, show the last contact time and connection state, and fall back to the existing simulator when no device has reported yet.
- Preserve the sample-warning control so the alert experience can still be tested.

## Device setup
- Add a setup page with the endpoint URL, exact JSON format, connection checklist, and troubleshooting.
- Provide a downloadable ESP32 Arduino example that sends readings over Wi-Fi; sensor-reading placeholders will be clearly marked because exact board pins and installed sensor libraries vary.

## Release
- Test device ingestion, stale/offline behavior, dashboard updates, and mobile layout.
- Publish the website and provide its public URL.
