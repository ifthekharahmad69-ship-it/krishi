import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Scan, History, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';

import ImageUploader from '@/components/common/ImageUploader';
import DiseaseResult from '@/components/disease/DiseaseResult';

export default function DiseaseDetection() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);

  const { data: history = [] } = useQuery({
    queryKey: ['diseaseReports'],
    queryFn: () => base44.entities.DiseaseReport.list('-created_date', 10),
  });

  const handleImageUpload = async (file) => {
    setIsAnalyzing(true);
    setResult(null);

    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploadedImageUrl(file_url);

    const analysisResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this crop image for diseases. Provide detailed analysis including:
1. Disease name (if any)
2. Confidence percentage (0-100)
3. Severity level (mild, moderate, severe, critical)
4. Symptoms observed
5. Recommended treatment
6. Prevention measures

If the image is not a crop or no disease is detected, indicate that clearly.`,
      file_urls: [file_url],
      response_json_schema: {
        type: 'object',
        properties: {
          disease_detected: { type: 'boolean' },
          crop_name: { type: 'string' },
          disease_name: { type: 'string' },
          confidence_percentage: { type: 'number' },
          severity: { type: 'string', enum: ['mild', 'moderate', 'severe', 'critical'] },
          symptoms: { type: 'array', items: { type: 'string' } },
          treatment: { type: 'string' },
          prevention: { type: 'string' },
        },
      },
    });

    setResult(analysisResult);

    if (analysisResult.disease_detected) {
      await base44.entities.DiseaseReport.create({
        ...analysisResult,
        image_url: file_url,
      });
    }

    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-950 dark:to-blue-950/30">
      {/* Header */}
      <div 
        className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="rounded-xl select-none dark:text-white dark:hover:bg-gray-800">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-semibold text-gray-900 dark:text-white">Disease Detection</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">AI-powered crop health analysis</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <Tabs defaultValue="scan" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <TabsTrigger value="scan" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 dark:text-white select-none">
              <Scan className="w-4 h-4 mr-2" />
              Scan Crop
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 dark:text-white select-none">
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-6">
            <Card className="p-6 rounded-2xl border-0 shadow-sm dark:bg-gray-900">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Upload Crop Image</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Take a clear photo of the affected plant part (leaf, stem, or fruit)
              </p>
              <ImageUploader
                onUpload={handleImageUpload}
                isUploading={isAnalyzing}
              />
            </Card>

            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  {result.disease_detected ? (
                    <DiseaseResult result={result} />
                  ) : (
                    <Card className="p-6 rounded-2xl border-0 shadow-sm bg-emerald-50">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-3xl">✅</span>
                        </div>
                        <h3 className="font-semibold text-emerald-800 mb-2">
                          No Disease Detected
                        </h3>
                        <p className="text-sm text-emerald-600">
                          Your crop appears to be healthy! Continue with regular care and monitoring.
                        </p>
                      </div>
                    </Card>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tips Card */}
            <Card className="p-5 rounded-2xl border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">📸 Tips for Best Results</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  Ensure good lighting - natural daylight works best
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  Focus on the affected area of the plant
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  Include both healthy and affected parts if possible
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  Avoid blurry images for accurate detection
                </li>
              </ul>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {history.length === 0 ? (
              <Card className="p-8 rounded-2xl border-0 shadow-sm text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <History className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">No Scan History</h3>
                <p className="text-sm text-gray-500">
                  Your scanned crops will appear here
                </p>
              </Card>
            ) : (
              history.map((report, index) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-4 rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex gap-4">
                      {report.image_url && (
                        <img
                          src={report.image_url}
                          alt={report.disease_name}
                          className="w-20 h-20 object-cover rounded-xl"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{report.disease_name}</h4>
                            <p className="text-sm text-gray-500">{report.crop_name}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            report.severity === 'critical' ? 'bg-red-100 text-red-700' :
                            report.severity === 'severe' ? 'bg-orange-100 text-orange-700' :
                            report.severity === 'moderate' ? 'bg-amber-100 text-amber-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {report.severity}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          {new Date(report.created_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}