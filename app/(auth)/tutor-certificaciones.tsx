import { API_ENDPOINTS } from '@/constants/api';
import { getTutorOnboarding } from '@/hooks/use-tutor-onboarding';
import { useApiRequest } from '@/services/api';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILES = 10;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

interface CertificationFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uri: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  mimeType: string;
  imagePreview?: string;
}

export default function TutorCertificacionesScreen() {
  const router = useRouter();
  const { post } = useApiRequest();

  const [certifications, setCertifications] = useState<CertificationFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const successCount = certifications.filter((c) => c.status === 'success').length;
  const isAtLimit = certifications.length >= MAX_FILES;
  const canSubmit = successCount > 0 && !submitting;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handlePickDocument = async () => {
    if (isAtLimit) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ALLOWED_TYPES,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const mimeType = file.mimeType || '';

      // Validate file type using actual mime type
      if (!ALLOWED_TYPES.includes(mimeType)) {
        alert('Tipo de archivo no permitido. Solo PDF, JPG o PNG.');
        return;
      }

      // Validate file size
      if (file.size && file.size > MAX_FILE_SIZE) {
        alert('El archivo excede 5 MB. Por favor, selecciona un archivo más pequeño.');
        return;
      }

      const newFile: CertificationFile = {
        id: Date.now().toString(),
        name: file.name,
        type: mimeType,
        size: file.size || 0,
        uri: file.uri,
        status: 'pending',
        mimeType: mimeType,
        imagePreview: mimeType.startsWith('image/') ? file.uri : undefined,
      };

      setCertifications((prev) => [...prev, newFile]);
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  const uploadFile = async (file: CertificationFile) => {
    setCertifications((prev) =>
      prev.map((f) => (f.id === file.id ? { ...f, status: 'uploading' as const } : f))
    );

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType,
      } as any);

      const { tutorId } = getTutorOnboarding();
      const uploadUrl = tutorId
        ? API_ENDPOINTS.uploadCertification(tutorId)
        : API_ENDPOINTS.uploadCertification('me');
      const response = await post(uploadUrl, formData, true);

      if (response.status === 201 || response.status === 200) {
        setCertifications((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, status: 'success' as const } : f))
        );
      } else {
        setCertifications((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, status: 'error' as const } : f))
        );
      }
    } catch (error) {
      setCertifications((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, status: 'error' as const } : f))
      );
    }
  };

  // Auto upload pending files sequentially (max 3 concurrent)
  useEffect(() => {
    const uploadPendingFiles = async () => {
      const pendingFiles = certifications.filter((f) => f.status === 'pending');
      const uploadingFiles = certifications.filter((f) => f.status === 'uploading');

      if (pendingFiles.length > 0 && uploadingFiles.length < 3) {
        setUploading(true);
        await uploadFile(pendingFiles[0]);
        setUploading(false);
      }
    };

    uploadPendingFiles();
  }, [certifications]);

  const handleRetry = (id: string) => {
    setCertifications((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'pending' as const } : f))
    );
  };

  const handleRemove = (id: string) => {
    setCertifications((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // No additional backend call needed - profile already marked as PENDING
      router.replace('/(auth)/solicitud-enviada' as any);
    } catch (error) {
      alert('Error al enviar solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const renderFileStatus = (file: CertificationFile) => {
    switch (file.status) {
      case 'uploading':
        return (
          <View className="flex-row items-center gap-2">
            <ActivityIndicator size="small" color="#006A75" />
            <Text className="text-sm text-text-muted">Subiendo...</Text>
          </View>
        );
      case 'success':
        return (
          <View className="flex-row items-center gap-2">
            <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
            <Text className="text-sm text-green-600">Subido correctamente</Text>
          </View>
        );
      case 'error':
        return (
          <View className="w-full">
            <View className="flex-row items-center gap-2 mb-2">
              <Ionicons name="close-circle" size={20} color="#ef4444" />
              <Text className="text-sm text-red-600">Error al subir. Intenta de nuevo.</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleRetry(file.id)}
              className="bg-primary/10 rounded-lg px-3 py-2"
            >
              <Text className="text-primary text-xs font-semibold">Reintentar</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  const isPDF = (file: CertificationFile) => file.mimeType === 'application/pdf';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-6" scrollEnabled={true}>
        <View className="pt-8 pb-4">
          <Text className="text-3xl font-bold text-text-primary mb-2">
            Certificaciones
          </Text>
          <Text className="text-base text-text-muted">
            Sube tus documentos para competar tu perfil.
          </Text>
        </View>

        {/* Upload Button */}
        <TouchableOpacity
          onPress={handlePickDocument}
          disabled={isAtLimit}
          activeOpacity={0.85}
          className={`py-4 px-4 rounded-xl border-2 border-dashed mb-6 ${
            isAtLimit ? 'border-red-300 bg-red-50' : 'border-primary bg-primary/5'
          }`}
        >
          <View className="flex-row items-center justify-center gap-3">
            <MaterialCommunityIcons
              name="cloud-upload-outline"
              size={24}
              color={isAtLimit ? '#ef4444' : '#006A75'}
            />
            <View className="flex-1">
              <Text
                className={`text-base font-semibold text-center ${
                  isAtLimit ? 'text-red-600' : 'text-primary'
                }`}
              >
                {isAtLimit ? 'Límite de 10 certificaciones alcanzado' : 'Subir certificación'}
              </Text>
              <Text className="text-xs text-text-muted text-center mt-1">
                PDF, JPG o PNG - máx. 5 MB
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* File List */}
        {certifications.length > 0 && (
          <View className="mb-8">
            <Text className="text-sm font-semibold text-text-primary mb-4">
              {certifications.length} archivo{certifications.length !== 1 ? 's' : ''} ({successCount}
              subido{successCount !== 1 ? 's' : ''})
            </Text>

            {certifications.map((file) => (
              <View
                key={file.id}
                className="bg-white rounded-xl p-4 mb-3 border border-border"
              >
                <View className="flex-row justify-between items-start gap-4">
                  {/* File Icon/Preview */}
                  <View className="flex-shrink-0">
                    {isPDF(file) ? (
                      <View className="w-12 h-12 rounded-lg bg-red-50 items-center justify-center">
                        <MaterialCommunityIcons name="file-pdf-box" size={28} color="#dc2626" />
                      </View>
                    ) : file.imagePreview ? (
                      <Image
                        source={{ uri: file.imagePreview }}
                        className="w-12 h-12 rounded-lg"
                      />
                    ) : (
                      <View className="w-12 h-12 rounded-lg bg-gray-100 items-center justify-center">
                        <MaterialCommunityIcons name="image" size={28} color="#999" />
                      </View>
                    )}
                  </View>

                  {/* File Info */}
                  <View className="flex-1 min-w-0">
                    <Text className="text-sm font-semibold text-text-primary mb-1" numberOfLines={1}>
                      {file.name}
                    </Text>
                    <Text className="text-xs text-text-muted">
                      {formatFileSize(file.size)}
                    </Text>

                    {/* Status */}
                    <View className="mt-3">{renderFileStatus(file)}</View>
                  </View>

                  {/* Delete Button */}
                  {file.status !== 'uploading' && (
                    <TouchableOpacity
                      onPress={() => handleRemove(file.id)}
                      className="flex-shrink-0 w-6 h-6 rounded-full items-center justify-center"
                    >
                      <Ionicons name="close" size={20} color="#999" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!canSubmit}
          activeOpacity={0.85}
          className={`rounded-full py-4 items-center mb-8 ${
            canSubmit ? 'bg-primary' : 'bg-secondary opacity-40'
          }`}
        >
          <Text
            className={`text-base font-semibold ${
              canSubmit ? 'text-primary-foreground' : 'text-text-muted'
            }`}
          >
            {submitting ? 'Enviando...' : 'Enviar solicitud'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
