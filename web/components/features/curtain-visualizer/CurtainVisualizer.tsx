import {
  Modal,
  Form,
  FormLayout,
  Select,
  DropZone,
  Stack,
  Text,
  Button,
  Thumbnail,
  Banner,
} from "@shopify/polaris";
import { useState, useCallback, useRef } from "react";

interface CurtainVisualizerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: VisualizerData) => void;
}

export interface VisualizerData {
  captureMethod: 'upload' | 'camera';
  curtainSize: 'standard' | 'custom';
  frameStyle: 'inside' | 'outside';
  image: File | null;
  customWidth?: number;
  customHeight?: number;
}

export function CurtainVisualizer({ open, onClose, onSubmit }: CurtainVisualizerProps) {
  const [captureMethod, setCaptureMethod] = useState<'upload' | 'camera'>('upload');
  const [curtainSize, setCurtainSize] = useState<'standard' | 'custom'>('standard');
  const [frameStyle, setFrameStyle] = useState<'inside' | 'outside'>('inside');
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleDropZoneDrop = useCallback((_dropFiles: File[], acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setFile(file);
        setError(null);
        // Create preview URL
        const url = URL.createObjectURL(file);
        setImagePreview(url);
      } else {
        setError('Please upload an image file');
      }
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCapturing(true);
        setError(null);
      }
    } catch (err) {
      setError('Unable to access camera. Please make sure you have granted camera permissions.');
      console.error('Error accessing camera:', err);
    }
  }, []);

  const captureImage = useCallback(() => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
            setFile(file);
            setImagePreview(URL.createObjectURL(blob));
            setIsCapturing(false);
            
            // Stop all video streams
            const stream = videoRef.current?.srcObject as MediaStream;
            stream?.getTracks().forEach(track => track.stop());
            if (videoRef.current) {
              videoRef.current.srcObject = null;
            }
          }
        }, 'image/jpeg');
      }
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (!file) {
      setError('Please upload or capture an image first');
      return;
    }

    onSubmit({
      captureMethod,
      curtainSize,
      frameStyle,
      image: file,
    });
  }, [captureMethod, curtainSize, frameStyle, file, onSubmit]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Visualize Curtains in Your Space"
      primaryAction={{
        content: 'Generate Preview',
        onAction: handleSubmit,
      }}
      secondaryActions={[
        {
          content: 'Cancel',
          onAction: onClose,
        },
      ]}
    >
      <Modal.Section>
        {error && (
          <Banner status="critical" onDismiss={() => setError(null)}>
            <p>{error}</p>
          </Banner>
        )}
        
        <Form onSubmit={handleSubmit}>
          <FormLayout>
            <Select
              label="How would you like to capture your space?"
              options={[
                {label: 'Upload a photo', value: 'upload'},
                {label: 'Use camera', value: 'camera'},
              ]}
              onChange={(value: 'upload' | 'camera') => {
                setCaptureMethod(value);
                setFile(null);
                setImagePreview(null);
                setIsCapturing(false);
                const stream = videoRef.current?.srcObject as MediaStream;
                stream?.getTracks().forEach(track => track.stop());
              }}
              value={captureMethod}
            />

            <Select
              label="Curtain Size"
              options={[
                {label: 'Standard', value: 'standard'},
                {label: 'Custom', value: 'custom'},
              ]}
              onChange={(value: 'standard' | 'custom') => setCurtainSize(value)}
              value={curtainSize}
            />

            <Select
              label="Frame Style"
              options={[
                {label: 'Inside Mount', value: 'inside'},
                {label: 'Outside Mount', value: 'outside'},
              ]}
              onChange={(value: 'inside' | 'outside') => setFrameStyle(value)}
              value={frameStyle}
            />

            {captureMethod === 'upload' && (
              <DropZone onDrop={handleDropZoneDrop} allowMultiple={false}>
                {imagePreview ? (
                  <Stack vertical>
                    <Thumbnail
                      source={imagePreview}
                      alt="Preview"
                      size="large"
                    />
                    <Text variant="bodyMd" as="p">
                      Click or drag to replace
                    </Text>
                  </Stack>
                ) : (
                  <Stack vertical>
                    <Text variant="bodyMd" as="p">
                      Drop an image or click to upload
                    </Text>
                  </Stack>
                )}
              </DropZone>
            )}

            {captureMethod === 'camera' && (
              <div style={{ textAlign: 'center' }}>
                {isCapturing ? (
                  <div>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      style={{ maxWidth: '100%', marginBottom: '1rem' }}
                    />
                    <Button onClick={captureImage}>Take Photo</Button>
                  </div>
                ) : imagePreview ? (
                  <Stack vertical>
                    <Thumbnail
                      source={imagePreview}
                      alt="Preview"
                      size="large"
                    />
                    <Button onClick={() => {
                      setImagePreview(null);
                      setFile(null);
                      startCamera();
                    }}>
                      Retake Photo
                    </Button>
                  </Stack>
                ) : (
                  <Button onClick={startCamera}>Start Camera</Button>
                )}
              </div>
            )}
          </FormLayout>
        </Form>
      </Modal.Section>
    </Modal>
  );
}
