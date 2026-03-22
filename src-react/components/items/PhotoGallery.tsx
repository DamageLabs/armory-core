import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import {
  CCard, CCardHeader, CCardBody, CButton, CBadge, CSpinner,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CFormInput, CFormLabel, CRow, CCol,
} from '@coreui/react';
import { Photo } from '../../types/Photo';
import * as photoService from '../../services/photoService';
import { useAlert } from '../../contexts/AlertContext';
import { formatBytes } from '../../utils/imageOptimizer';
import ConfirmModal from '../common/ConfirmModal';

interface PhotoGalleryProps {
  itemId: number;
}

export default function PhotoGallery({ itemId }: PhotoGalleryProps) {
  const { showSuccess, showError } = useAlert();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Photo | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [isLoadingLightbox, setIsLoadingLightbox] = useState(false);
  const [thumbUrls, setThumbUrls] = useState<Record<number, string>>({});

  const loadPhotos = useCallback(async () => {
    try {
      const data = await photoService.getPhotos(itemId);
      setPhotos(data);
    } catch {
      // Supplementary — silent fail
    }
  }, [itemId]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  // Load thumbnail URLs for all photos
  useEffect(() => {
    let cancelled = false;
    async function loadThumbs() {
      const urls: Record<number, string> = {};
      for (const photo of photos) {
        if (cancelled) break;
        try {
          urls[photo.id] = await photoService.getPhotoBlobUrl(photo.id);
        } catch {
          // skip
        }
      }
      if (!cancelled) setThumbUrls(urls);
    }
    loadThumbs();
    return () => {
      cancelled = true;
      Object.values(thumbUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photos]);

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
          showError(`"${file.name}" is not an image.`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          showError(`"${file.name}" exceeds 10MB limit.`);
          continue;
        }
        await photoService.uploadPhoto(itemId, file);
      }
      showSuccess(`Photo${files.length > 1 ? 's' : ''} uploaded.`);
      await loadPhotos();
    } catch {
      showError('Failed to upload photo.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await photoService.deletePhoto(deleteTarget.id);
      if (thumbUrls[deleteTarget.id]) {
        URL.revokeObjectURL(thumbUrls[deleteTarget.id]);
      }
      showSuccess('Photo deleted.');
      await loadPhotos();
    } catch {
      showError('Failed to delete photo.');
    }
    setDeleteTarget(null);
  };

  const handleSetPrimary = async (photo: Photo) => {
    try {
      await photoService.setPrimary(photo.id);
      showSuccess('Primary photo updated.');
      await loadPhotos();
    } catch {
      showError('Failed to set primary photo.');
    }
  };

  const openLightbox = useCallback(async (photo: Photo) => {
    setLightboxPhoto(photo);
    setIsLoadingLightbox(true);
    try {
      const url = await photoService.getPhotoBlobUrl(photo.id);
      setLightboxUrl(url);
    } catch {
      showError('Failed to load photo.');
      setLightboxPhoto(null);
    } finally {
      setIsLoadingLightbox(false);
    }
  }, [showError]);

  const closeLightbox = () => {
    if (lightboxUrl) URL.revokeObjectURL(lightboxUrl);
    setLightboxPhoto(null);
    setLightboxUrl(null);
  };

  const navigateLightbox = (direction: 1 | -1) => {
    if (!lightboxPhoto) return;
    const idx = photos.findIndex((p) => p.id === lightboxPhoto.id);
    const nextIdx = idx + direction;
    if (nextIdx >= 0 && nextIdx < photos.length) {
      if (lightboxUrl) URL.revokeObjectURL(lightboxUrl);
      setLightboxUrl(null);
      openLightbox(photos[nextIdx]);
    }
  };

  const handleMovePhoto = async (photoId: number, direction: 1 | -1) => {
    const idx = photos.findIndex((p) => p.id === photoId);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= photos.length) return;
    const newOrder = [...photos];
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
    const photoIds = newOrder.map((p) => p.id);
    try {
      await photoService.reorderPhotos(itemId, photoIds);
      await loadPhotos();
    } catch {
      showError('Failed to reorder photos.');
    }
  };

  return (
    <>
      <CCard className="mb-3">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">
            Photos{' '}
            {photos.length > 0 && <CBadge color="secondary">{photos.length}</CBadge>}
          </h6>
          <div>
            <CFormLabel
              htmlFor="photo-upload"
              className="btn btn-sm btn-outline-primary mb-0"
              style={{ cursor: 'pointer' }}
            >
              {isUploading ? <><CSpinner size="sm" className="me-1" />Uploading...</> : 'Upload Photos'}
            </CFormLabel>
            <CFormInput
              id="photo-upload"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleUpload}
              disabled={isUploading}
              className="d-none"
              multiple
            />
          </div>
        </CCardHeader>

        {photos.length > 0 ? (
          <CCardBody>
            <CRow className="g-2">
              {photos.map((photo, idx) => (
                <CCol key={photo.id} xs={4} sm={3} md={2}>
                  <div
                    className="position-relative"
                    style={{
                      aspectRatio: '1',
                      cursor: 'pointer',
                      border: photo.isPrimary ? '2px solid var(--cui-primary)' : '1px solid var(--cui-border-color)',
                      borderRadius: '6px',
                      overflow: 'hidden',
                    }}
                  >
                    {thumbUrls[photo.id] ? (
                      <img
                        src={thumbUrls[photo.id]}
                        alt={photo.originalName}
                        onClick={() => openLightbox(photo)}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        className="d-flex align-items-center justify-content-center h-100 text-muted"
                        onClick={() => openLightbox(photo)}
                      >
                        <CSpinner size="sm" />
                      </div>
                    )}
                    {photo.isPrimary && (
                      <CBadge
                        color="primary"
                        className="position-absolute"
                        style={{ top: '4px', left: '4px', fontSize: '0.65rem' }}
                      >
                        Primary
                      </CBadge>
                    )}
                    <div
                      className="position-absolute d-flex gap-1"
                      style={{ bottom: '4px', right: '4px' }}
                    >
                      {!photo.isPrimary && (
                        <CButton
                          color="primary"
                          size="sm"
                          style={{ padding: '1px 4px', fontSize: '0.65rem' }}
                          title="Set as primary"
                          onClick={(e) => { e.stopPropagation(); handleSetPrimary(photo); }}
                        >
                          Primary
                        </CButton>
                      )}
                      {idx > 0 && (
                        <CButton
                          color="secondary"
                          size="sm"
                          style={{ padding: '1px 4px', fontSize: '0.65rem' }}
                          title="Move left"
                          onClick={(e) => { e.stopPropagation(); handleMovePhoto(photo.id, -1); }}
                        >
                          &larr;
                        </CButton>
                      )}
                      {idx < photos.length - 1 && (
                        <CButton
                          color="secondary"
                          size="sm"
                          style={{ padding: '1px 4px', fontSize: '0.65rem' }}
                          title="Move right"
                          onClick={(e) => { e.stopPropagation(); handleMovePhoto(photo.id, 1); }}
                        >
                          &rarr;
                        </CButton>
                      )}
                      <CButton
                        color="danger"
                        size="sm"
                        style={{ padding: '1px 4px', fontSize: '0.65rem' }}
                        title="Delete"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(photo); }}
                      >
                        &times;
                      </CButton>
                    </div>
                  </div>
                  <small className="text-muted d-block text-truncate mt-1" style={{ fontSize: '0.7rem' }}>
                    {formatBytes(photo.sizeBytes)}
                  </small>
                </CCol>
              ))}
            </CRow>
          </CCardBody>
        ) : (
          <CCardBody className="text-muted text-center py-3">
            No photos yet. Upload to get started.
          </CCardBody>
        )}
      </CCard>

      {/* Lightbox Modal */}
      <CModal
        visible={!!lightboxPhoto}
        onClose={closeLightbox}
        size="xl"
        alignment="center"
      >
        {lightboxPhoto && (
          <>
            <CModalHeader>
              <CModalTitle>{lightboxPhoto.originalName}</CModalTitle>
            </CModalHeader>
            <CModalBody className="text-center p-2">
              {isLoadingLightbox ? (
                <div className="py-5">
                  <CSpinner />
                </div>
              ) : lightboxUrl ? (
                <img
                  src={lightboxUrl}
                  alt={lightboxPhoto.originalName}
                  style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                />
              ) : null}
            </CModalBody>
            <CModalFooter className="d-flex justify-content-between">
              <div>
                <CButton
                  color="secondary"
                  size="sm"
                  disabled={photos.findIndex((p) => p.id === lightboxPhoto.id) === 0}
                  onClick={() => navigateLightbox(-1)}
                  className="me-1"
                >
                  Previous
                </CButton>
                <CButton
                  color="secondary"
                  size="sm"
                  disabled={photos.findIndex((p) => p.id === lightboxPhoto.id) === photos.length - 1}
                  onClick={() => navigateLightbox(1)}
                >
                  Next
                </CButton>
              </div>
              <CButton color="secondary" onClick={closeLightbox}>Close</CButton>
            </CModalFooter>
          </>
        )}
      </CModal>

      <ConfirmModal
        show={!!deleteTarget}
        title="Delete Photo"
        message={`Delete "${deleteTarget?.originalName}"?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
