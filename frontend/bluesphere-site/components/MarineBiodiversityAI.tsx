/*
 * Marine Biodiversity AI Recognition System
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  ArrowUpTrayIcon,
  CameraIcon,
  MapPinIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface SpeciesIdentification {
  speciesId: string;
  commonName: string;
  scientificName: string;
  confidence: number;
  conservationStatus: 'least_concern' | 'near_threatened' | 'vulnerable' | 'endangered' | 'critically_endangered';
  habitat: string[];
  threats: string[];
  funFacts: string[];
}

interface IdentificationResult {
  species: SpeciesIdentification;
  location?: {
    latitude: number;
    longitude: number;
    depth?: number;
    region: string;
  };
  timestamp: Date;
  imageUrl: string;
}

const MarineBiodiversityAI: React.FC = React.memo(() => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<IdentificationResult | null>(null);
  const [error, setError] = useState<string>('');
  const [useCamera, setUseCamera] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      if (result?.imageUrl) {
        URL.revokeObjectURL(result.imageUrl);
      }
    };
  }, [imagePreview, result?.imageUrl]);

  // Mock AI identification (in production, this would call actual ML service)
  const mockIdentifySpecies = useCallback(async (imageFile: File): Promise<IdentificationResult> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock species data
    const mockSpecies: SpeciesIdentification[] = [
      {
        speciesId: 'great-white-shark',
        commonName: 'Great White Shark',
        scientificName: 'Carcharodon carcharias',
        confidence: 0.94,
        conservationStatus: 'vulnerable',
        habitat: ['Coastal waters', 'Open ocean', 'Continental shelves'],
        threats: ['Overfishing', 'Bycatch', 'Habitat loss'],
        funFacts: [
          'Can detect blood from 3 miles away',
          'Can live up to 70 years',
          'Body temperature is warmer than surrounding water'
        ]
      },
      {
        speciesId: 'green-sea-turtle',
        commonName: 'Green Sea Turtle',
        scientificName: 'Chelonia mydas',
        confidence: 0.89,
        conservationStatus: 'endangered',
        habitat: ['Tropical reefs', 'Seagrass beds', 'Open ocean'],
        threats: ['Plastic pollution', 'Climate change', 'Coastal development'],
        funFacts: [
          'Can hold breath for up to 5 hours',
          'Navigate using Earth\'s magnetic field',
          'Change diet from omnivore to herbivore as they age'
        ]
      },
      {
        speciesId: 'clownfish',
        commonName: 'Clownfish',
        scientificName: 'Amphiprioninae',
        confidence: 0.92,
        conservationStatus: 'least_concern',
        habitat: ['Coral reefs', 'Anemone gardens'],
        threats: ['Ocean acidification', 'Coral bleaching', 'Aquarium trade'],
        funFacts: [
          'All clownfish are born male',
          'Immune to anemone stings',
          'Can change sex when needed'
        ]
      }
    ];

    const randomSpecies = mockSpecies[Math.floor(Math.random() * mockSpecies.length)];

    return {
      species: randomSpecies,
      location: {
        latitude: -33.8688,
        longitude: 151.2093,
        depth: Math.floor(Math.random() * 50) + 5,
        region: 'Great Barrier Reef, Australia'
      },
      timestamp: new Date(),
      imageUrl: URL.createObjectURL(imageFile)
    };
  }, []);

  const handleImageUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('Image size must be less than 10MB');
      return;
    }

    // Clean up previous preview URL
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
    setResult(null);
  }, [imagePreview]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  }, [handleImageUpload]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setUseCamera(true);
      }
    } catch (err) {
      setError('Camera access denied or not available');
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (context) {
        context.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
            handleImageUpload(file);
            setUseCamera(false);
            // Stop camera stream
            const stream = video.srcObject as MediaStream;
            stream?.getTracks().forEach(track => track.stop());
          }
        });
      }
    }
  }, [handleImageUpload]);

  const analyzeImage = useCallback(async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError('');

    try {
      const result = await mockIdentifySpecies(selectedImage);
      setResult(result);
    } catch (err) {
      setError('Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedImage, mockIdentifySpecies]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'least_concern': return 'text-green-600';
      case 'near_threatened': return 'text-yellow-600';
      case 'vulnerable': return 'text-orange-600';
      case 'endangered': return 'text-red-600';
      case 'critically_endangered': return 'text-red-800';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'least_concern') return <CheckCircleIcon className="w-4 h-4" />;
    return <ExclamationTriangleIcon className="w-4 h-4" />;
  };

  return (
    <>
      <style jsx>{`
        .ai-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border-radius: 20px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        .upload-zone {
          border: 2px dashed #0ea5e9;
          border-radius: 16px;
          padding: 3rem;
          text-align: center;
          background: rgba(255, 255, 255, 0.5);
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .upload-zone:hover {
          border-color: #0284c7;
          background: rgba(255, 255, 255, 0.7);
          transform: translateY(-2px);
        }

        .upload-zone.dragover {
          border-color: #0369a1;
          background: rgba(14, 165, 233, 0.1);
        }

        .image-preview {
          max-width: 100%;
          max-height: 400px;
          border-radius: 12px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }

        .result-card {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .confidence-bar {
          background: linear-gradient(90deg, #ef4444 0%, #f59e0b 30%, #10b981 60%, #059669 100%);
          height: 8px;
          border-radius: 4px;
          overflow: hidden;
        }

        .confidence-fill {
          height: 100%;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }

        .camera-container {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          max-width: 600px;
          margin: 0 auto;
        }

        .camera-controls {
          position: absolute;
          bottom: 1rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 1rem;
        }

        @media (max-width: 768px) {
          .ai-container {
            padding: 1rem;
            margin: 1rem;
          }

          .upload-zone {
            padding: 2rem 1rem;
          }
        }
      `}</style>

      <div className="ai-container">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 text-white rounded-full mb-4">
            <CameraIcon className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🐠 Marine Species AI Recognition
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload a photo of marine life and our AI will identify the species,
            provide conservation information, and add the sighting to our global database.
          </p>
        </div>

        {!useCamera ? (
          <div className="mb-8">
            <div
              className="upload-zone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('dragover');
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('dragover');
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('dragover');
                const file = e.dataTransfer.files[0];
                if (file) handleImageUpload(file);
              }}
            >
              <ArrowUpTrayIcon className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Upload Marine Life Photo
              </h3>
              <p className="text-gray-600 mb-4">
                Drag and drop or click to select an image
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                  Choose File
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startCamera();
                  }}
                  className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <CameraIcon className="w-4 h-4 mr-2" />
                  Use Camera
                </button>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="camera-container mb-8">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-auto"
            />
            <div className="camera-controls">
              <button
                onClick={capturePhoto}
                className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 transition-colors"
              >
                <CameraIcon className="w-6 h-6" />
              </button>
              <button
                onClick={() => {
                  setUseCamera(false);
                  const stream = videoRef.current?.srcObject as MediaStream;
                  stream?.getTracks().forEach(track => track.stop());
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {imagePreview && (
          <div className="mb-8 text-center">
            <img
              src={imagePreview}
              alt="Selected marine life"
              className="image-preview mx-auto mb-4"
            />
            <button
              onClick={analyzeImage}
              disabled={isAnalyzing}
              className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-semibold"
            >
              {isAnalyzing ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing Species...
                </>
              ) : (
                <>
                  <InformationCircleIcon className="w-5 h-5 mr-2" />
                  Identify Species
                </>
              )}
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {result && (
          <div className="result-card">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <img
                  src={result.imageUrl}
                  alt={result.species.commonName}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  {getStatusIcon(result.species.conservationStatus)}
                  <h2 className="text-2xl font-bold text-gray-900">
                    {result.species.commonName}
                  </h2>
                </div>

                <p className="text-gray-600 italic mb-4">
                  {result.species.scientificName}
                </p>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      AI Confidence
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {Math.round(result.species.confidence * 100)}%
                    </span>
                  </div>
                  <div className="confidence-bar">
                    <div
                      className="confidence-fill"
                      style={{ width: `${result.species.confidence * 100}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Conservation Status</h4>
                    <div className={`flex items-center gap-1 ${getStatusColor(result.species.conservationStatus)}`}>
                      {getStatusIcon(result.species.conservationStatus)}
                      <span className="capitalize font-medium">
                        {result.species.conservationStatus.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {result.location && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-1">
                        <MapPinIcon className="w-4 h-4" />
                        Location
                      </h4>
                      <p className="text-sm text-gray-600">
                        {result.location.region}
                        {result.location.depth && (
                          <span className="block">Depth: {result.location.depth}m</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-1 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Habitat</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.species.habitat.map((habitat, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {habitat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Primary Threats</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.species.threats.map((threat, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                        >
                          {threat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Fun Facts</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {result.species.funFacts.map((fact, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {fact}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 flex gap-4">
                  <button className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">
                    Add to Global Database
                  </button>
                  <button className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
                    View on Map
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
});

MarineBiodiversityAI.displayName = 'MarineBiodiversityAI';

export default MarineBiodiversityAI;