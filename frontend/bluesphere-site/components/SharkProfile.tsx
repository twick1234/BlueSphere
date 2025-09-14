import React from 'react';
import { SharkProfile as SharkProfileData, SharkTrackPoint } from '../lib/shark-tracking';

interface SharkProfileProps {
  profile: SharkProfileData;
  recentTrack?: SharkTrackPoint[];
  onViewFullTrack?: () => void;
  onClose?: () => void;
}

const SharkProfile: React.FC<SharkProfileProps> = ({
  profile,
  recentTrack = [],
  onViewFullTrack,
  onClose
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSpeciesEmoji = (species: string) => {
    if (species.includes('Carcharodon')) return '🦈'; // Great White
    if (species.includes('Galeocerdo')) return '🐅'; // Tiger Shark
    if (species.includes('Rhincodon')) return '🐋'; // Whale Shark
    if (species.includes('Sphyrna')) return '🔨'; // Hammerhead
    return '🦈';
  };

  const getConservationColor = (status: string) => {
    if (status.includes('Critically Endangered')) return 'text-red-600 bg-red-50';
    if (status.includes('Endangered')) return 'text-red-500 bg-red-50';
    if (status.includes('Vulnerable')) return 'text-orange-500 bg-orange-50';
    if (status.includes('Near Threatened')) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-lg">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center mb-2">
              <span className="text-4xl mr-3">{getSpeciesEmoji(profile.species)}</span>
              <div>
                <h1 className="text-3xl font-bold">{profile.name}</h1>
                {profile.nickname && (
                  <p className="text-blue-100 italic">&quot;{profile.nickname}&quot;</p>
                )}
              </div>
            </div>
            <p className="text-lg text-blue-100">{profile.species_common_name}</p>
            <p className="text-sm text-blue-200 italic">{profile.species}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 text-xl font-bold"
              aria-label="Close profile"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{profile.length_m}m</div>
            <div className="text-sm text-gray-600">Length</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {profile.weight_kg ? `${profile.weight_kg}kg` : 'Unknown'}
            </div>
            <div className="text-sm text-gray-600">Weight</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {profile.sex === 'M' ? 'Male' : profile.sex === 'F' ? 'Female' : 'Unknown'}
            </div>
            <div className="text-sm text-gray-600">Sex</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {profile.days_tracked || 'Unknown'}
            </div>
            <div className="text-sm text-gray-600">Days Tracked</div>
          </div>
        </div>

        {/* Conservation Status */}
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Conservation Status</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConservationColor(profile.conservation_status)}`}>
              {profile.conservation_status}
            </span>
          </div>
        </div>

        {/* Current Location */}
        {profile.current_location && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">📍 Current Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Coordinates:</span> {profile.current_location.lat.toFixed(3)}, {profile.current_location.lon.toFixed(3)}
              </div>
              <div>
                <span className="font-medium">Area:</span> {profile.current_location.description}
              </div>
              {profile.current_location.water_temp_c && (
                <div>
                  <span className="font-medium">Water Temperature:</span> {profile.current_location.water_temp_c}°C
                </div>
              )}
              <div>
                <span className="font-medium">Last Update:</span> {formatDate(profile.last_ping)}
              </div>
            </div>
          </div>
        )}

        {/* Tracking Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">🏷️ Tracking Details</h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Tagged:</span> {formatDate(profile.tag_date)}</div>
              <div><span className="font-medium">Location:</span> {profile.tag_location}</div>
              <div><span className="font-medium">Organization:</span> {profile.tag_organization}</div>
              <div><span className="font-medium">Program:</span> {profile.research_program}</div>
              {profile.estimated_age && (
                <div><span className="font-medium">Estimated Age:</span> {profile.estimated_age} years</div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">📊 Movement Stats</h3>
            <div className="space-y-2 text-sm">
              {profile.total_distance_km && (
                <div><span className="font-medium">Total Distance:</span> {profile.total_distance_km.toLocaleString()} km</div>
              )}
              {profile.max_depth_m && (
                <div><span className="font-medium">Max Depth:</span> {profile.max_depth_m}m</div>
              )}
              {profile.temperature_range && (
                <div>
                  <span className="font-medium">Temp Range:</span> {profile.temperature_range.min}°C - {profile.temperature_range.max}°C
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Biography */}
        {profile.biography && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">📖 Biography</h3>
            <p className="text-gray-700 leading-relaxed">{profile.biography}</p>
          </div>
        )}

        {/* Recent Track Preview */}
        {recentTrack.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-900">🗺️ Recent Movements</h3>
              {onViewFullTrack && (
                <button
                  onClick={onViewFullTrack}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View Full Track →
                </button>
              )}
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Recent Pings:</span> {recentTrack.length}
                </div>
                <div>
                  <span className="font-medium">Latest:</span> {formatDate(recentTrack[recentTrack.length - 1]?.timestamp || '')}
                </div>
                <div>
                  <span className="font-medium">Oldest:</span> {formatDate(recentTrack[0]?.timestamp || '')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t">
          {onViewFullTrack && (
            <button
              onClick={onViewFullTrack}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
            >
              🗺️ View Movement History
            </button>
          )}

          {profile.social_media?.twitter && (
            <a
              href={profile.social_media.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium"
            >
              🐦 Follow on Twitter
            </a>
          )}

          <a
            href={`https://www.ocearch.org/tracker/?list=${profile.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
          >
            🔗 OCEARCH Profile
          </a>
        </div>

        {/* Research Attribution */}
        <div className="text-xs text-gray-500 pt-4 border-t">
          <p>
            Tracking data provided by {profile.tag_organization} •
            Support marine research at <a href="https://www.ocearch.org" className="text-blue-600 hover:underline">OCEARCH.org</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SharkProfile;