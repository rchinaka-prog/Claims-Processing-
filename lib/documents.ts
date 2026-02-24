import { supabase } from './supabase';

export async function uploadDocument(
  claimId: string,
  file: File,
  documentType: string,
  uploadedBy: string
) {
  const fileName = `${claimId}/${documentType}/${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from('claim-documents')
    .upload(fileName, file);

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('claim-documents')
    .getPublicUrl(fileName);

  const { data: docData, error: docError } = await supabase
    .from('claim_documents')
    .insert([
      {
        claim_id: claimId,
        document_type: documentType,
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_size: file.size,
        uploaded_by: uploadedBy,
      },
    ])
    .select();

  if (docError) throw docError;
  return docData?.[0];
}

export async function getClaimDocuments(claimId: string) {
  const { data, error } = await supabase
    .from('claim_documents')
    .select('*')
    .eq('claim_id', claimId)
    .order('uploaded_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function deleteDocument(documentId: string) {
  const { error } = await supabase
    .from('claim_documents')
    .delete()
    .eq('id', documentId);

  if (error) throw error;
}

export async function uploadPhoto(
  claimId: string,
  file: File,
  photoType: 'damage' | 'completion' | 'inspection' | 'other',
  uploadedBy: string
) {
  const fileName = `${claimId}/photos/${photoType}/${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from('claim-photos')
    .upload(fileName, file);

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('claim-photos')
    .getPublicUrl(fileName);

  const { data: photoData, error: photoError } = await supabase
    .from('claim_photos')
    .insert([
      {
        claim_id: claimId,
        photo_type: photoType,
        file_url: urlData.publicUrl,
        uploaded_by: uploadedBy,
      },
    ])
    .select();

  if (photoError) throw photoError;
  return photoData?.[0];
}

export async function getClaimPhotos(claimId: string) {
  const { data, error } = await supabase
    .from('claim_photos')
    .select('*')
    .eq('claim_id', claimId)
    .order('uploaded_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function deletePhoto(photoId: string) {
  const { error } = await supabase
    .from('claim_photos')
    .delete()
    .eq('id', photoId);

  if (error) throw error;
}
