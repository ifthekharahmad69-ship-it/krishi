import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, MapPin, Droplets, Leaf, Save, Loader2, Check, Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTheme } from '@/components/common/ThemeProvider';
import DeleteAccountDialog from '@/components/common/DeleteAccountDialog';

export default function FarmProfile() {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saved, setSaved] = useState(false);
  const { theme, toggleTheme, isDark } = useTheme();

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['farmProfiles'],
    queryFn: () => base44.entities.FarmProfile.list('-created_date', 1),
  });

  const existingProfile = profiles[0];

  const [formData, setFormData] = useState({
    farm_name: '',
    location: '',
    state: '',
    district: '',
    total_land_acres: '',
    irrigation_type: '',
    soil_type: '',
    current_crops: [],
    preferred_language: 'en',
  });

  useEffect(() => {
    if (existingProfile) {
      setFormData({
        farm_name: existingProfile.farm_name || '',
        location: existingProfile.location || '',
        state: existingProfile.state || '',
        district: existingProfile.district || '',
        total_land_acres: existingProfile.total_land_acres?.toString() || '',
        irrigation_type: existingProfile.irrigation_type || '',
        soil_type: existingProfile.soil_type || '',
        current_crops: existingProfile.current_crops || [],
        preferred_language: existingProfile.preferred_language || 'en',
      });
    }
  }, [existingProfile]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaved(false);

    const data = {
      ...formData,
      total_land_acres: parseFloat(formData.total_land_acres) || 0,
    };

    if (existingProfile) {
      await base44.entities.FarmProfile.update(existingProfile.id, data);
    } else {
      await base44.entities.FarmProfile.create(data);
    }

    queryClient.invalidateQueries({ queryKey: ['farmProfiles'] });
    setIsSaving(false);
    setSaved(true);
    toast.success('Farm profile saved successfully!');
    
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    
    // Delete all user data
    if (existingProfile) {
      await base44.entities.FarmProfile.delete(existingProfile.id);
    }
    
    // Delete chat history, disease reports, quiz scores
    const [chats, reports, scores] = await Promise.all([
      base44.entities.ChatHistory.list(),
      base44.entities.DiseaseReport.list(),
      base44.entities.QuizScore.list(),
    ]);
    
    await Promise.all([
      ...chats.map(c => base44.entities.ChatHistory.delete(c.id)),
      ...reports.map(r => base44.entities.DiseaseReport.delete(r.id)),
      ...scores.map(s => base44.entities.QuizScore.delete(s.id)),
    ]);

    setIsDeleting(false);
    toast.success('Account data deleted successfully');
    base44.auth.logout();
  };

  const states = [
    'Andhra Pradesh', 'Bihar', 'Gujarat', 'Haryana', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Punjab', 'Rajasthan',
    'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-pink-50/30 dark:from-gray-950 dark:to-pink-950/30">
      {/* Header */}
      <div 
        className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-xl select-none dark:text-white dark:hover:bg-gray-800">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-semibold text-gray-900 dark:text-white">My Farm</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage your farm profile</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-xl select-none dark:text-white dark:hover:bg-gray-800"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {isLoading ? (
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-pink-600 dark:text-pink-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
          </div>
        ) : (
          <>
            {/* Profile Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6 rounded-2xl border-0 shadow-sm bg-gradient-to-r from-pink-500 to-rose-600 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">
                      {formData.farm_name || 'Your Farm'}
                    </h2>
                    <p className="text-white/80 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {formData.location || formData.state || 'Add your location'}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Basic Info */}
            <Card className="p-6 rounded-2xl border-0 shadow-sm dark:bg-gray-900">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="farm_name" className="dark:text-gray-300">Farm Name</Label>
                  <Input
                    id="farm_name"
                    placeholder="e.g., Green Acres Farm"
                    value={formData.farm_name}
                    onChange={(e) => setFormData({ ...formData, farm_name: e.target.value })}
                    className="mt-1.5 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="state" className="dark:text-gray-300">State</Label>
                    <Select
                      value={formData.state}
                      onValueChange={(value) => setFormData({ ...formData, state: value })}
                    >
                      <SelectTrigger className="mt-1.5 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        {states.map((state) => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="district" className="dark:text-gray-300">District</Label>
                    <Input
                      id="district"
                      placeholder="Your district"
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      className="mt-1.5 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location" className="dark:text-gray-300">Village/Location</Label>
                  <Input
                    id="location"
                    placeholder="Your village or location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="mt-1.5 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </Card>

            {/* Farm Details */}
            <Card className="p-6 rounded-2xl border-0 shadow-sm dark:bg-gray-900">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Farm Details</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="land" className="dark:text-gray-300">Total Land (acres)</Label>
                  <Input
                    id="land"
                    type="number"
                    placeholder="e.g., 10"
                    value={formData.total_land_acres}
                    onChange={(e) => setFormData({ ...formData, total_land_acres: e.target.value })}
                    className="mt-1.5 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="dark:text-gray-300">Irrigation Type</Label>
                    <Select
                      value={formData.irrigation_type}
                      onValueChange={(value) => setFormData({ ...formData, irrigation_type: value })}
                    >
                      <SelectTrigger className="mt-1.5 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        <SelectItem value="rainfed">Rainfed</SelectItem>
                        <SelectItem value="canal">Canal</SelectItem>
                        <SelectItem value="tubewell">Tubewell</SelectItem>
                        <SelectItem value="drip">Drip</SelectItem>
                        <SelectItem value="sprinkler">Sprinkler</SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="dark:text-gray-300">Soil Type</Label>
                    <Select
                      value={formData.soil_type}
                      onValueChange={(value) => setFormData({ ...formData, soil_type: value })}
                    >
                      <SelectTrigger className="mt-1.5 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                        <SelectValue placeholder="Select soil" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        <SelectItem value="alluvial">Alluvial</SelectItem>
                        <SelectItem value="black">Black (Cotton)</SelectItem>
                        <SelectItem value="red">Red</SelectItem>
                        <SelectItem value="laterite">Laterite</SelectItem>
                        <SelectItem value="sandy">Sandy</SelectItem>
                        <SelectItem value="clay">Clay</SelectItem>
                        <SelectItem value="loamy">Loamy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </Card>

            {/* Language Preference */}
            <Card className="p-6 rounded-2xl border-0 shadow-sm dark:bg-gray-900">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Preferences</h3>
              <div>
                <Label className="dark:text-gray-300">Preferred Language</Label>
                <Select
                  value={formData.preferred_language}
                  onValueChange={(value) => setFormData({ ...formData, preferred_language: value })}
                >
                  <SelectTrigger className="mt-1.5 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">हिंदी (Hindi)</SelectItem>
                    <SelectItem value="te">తెలుగు (Telugu)</SelectItem>
                    <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
                    <SelectItem value="kn">ಕನ್ನಡ (Kannada)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full rounded-xl h-12 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 select-none"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : saved ? (
                <Check className="w-5 h-5 mr-2" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              {isSaving ? 'Saving...' : saved ? 'Saved!' : 'Save Profile'}
            </Button>

            {/* Danger Zone */}
            <Card className="p-6 rounded-2xl border-0 shadow-sm border-red-100 dark:border-red-900/50 dark:bg-gray-900">
              <h3 className="font-semibold text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <DeleteAccountDialog onDelete={handleDeleteAccount} isDeleting={isDeleting} />
            </Card>
          </>
        )}
      </div>
    </div>
  );
}