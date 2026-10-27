import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Task, TaskStatus, DeliverableType, ChallengeCategory } from '../types';
import { getWorkDriveCycleFolderName, resolveWorkDriveOpenUrl } from '../utils/workdriveUtils';
import { TaskDiscussionPanel } from './TaskDiscussionPanel';
import {
  X,
  User,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Plus,
  Send,
  MessageSquare,
  History,
  FileText,
  ExternalLink,
  Download,
  Trash2,
  ShieldAlert,
  Archive,
  RotateCcw,
  Tag,
  Check,
  Edit3,
  Info,
  Zap,
  Folder,
  FolderSync,
  UploadCloud,
  Copy,
  FileCheck,
  Cloud,
  HardDrive,
} from 'lucide-react';

interface TaskModalProps {
  taskId: string;
  onClose: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ taskId, onClose }) => {
  const {
    tasks,
    currentUser,
    users,
    departments,
    hasDepartmentLead,
    canEditTask,
    canApproveTask,
    isCrossDeptSupport,
    updateTask,
    updateTaskStatus,
    approveTask,
    requestRevision,
    addDeliverable,
    removeDeliverable,
    cloudinaryConfig,
    updateCloudinaryConfig,
    workdriveConfig,
    generateDeliverableWorkDriveMeta,
    activeWeek,
    weeks,
    getTaskComments,
    getTaskActivities,
    archiveTask,
    restoreTask,
    deleteTask,
    selectedTaskTab,
    setSelectedTaskTab,
    setActiveView,
  } = useApp();

  const task = tasks.find((t) => t.id === taskId);
  const [activeTab, setActiveTab] = useState<'details' | 'deliverables' | 'comments' | 'history'>(
    selectedTaskTab || 'details'
  );

  useEffect(() => {
    if (selectedTaskTab) {
      setActiveTab(selectedTaskTab);
    }
  }, [selectedTaskTab, taskId]);

  // Deliverable input & Cloudinary upload state
  const [deliverableMode, setDeliverableMode] = useState<'upload' | 'link'>('upload');
  const [delName, setDelName] = useState('');
  const [delUrl, setDelUrl] = useState('');
  const [delType, setDelType] = useState<DeliverableType>('Document');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetCycle, setTargetCycle] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copiedPathId, setCopiedPathId] = useState<string | null>(null);
  const [showQuickCloudinarySetup, setShowQuickCloudinarySetup] = useState(false);
  const [quickCloudinaryUrl, setQuickCloudinaryUrl] = useState('');
  const [quickCloudName, setQuickCloudName] = useState(cloudinaryConfig.cloudName || '');
  const [quickApiKey, setQuickApiKey] = useState(cloudinaryConfig.apiKey || '');
  const [quickApiSecret, setQuickApiSecret] = useState(cloudinaryConfig.apiSecret || '');
  const [quickUploadPreset, setQuickUploadPreset] = useState(cloudinaryConfig.uploadPreset || '');
  const [quickSavingConfig, setQuickSavingConfig] = useState(false);

  useEffect(() => {
    if (task) {
      setTargetCycle(task.weekId || activeWeek);
    }
  }, [task?.id, task?.weekId, activeWeek]);

  // Revision input
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionReasonInput, setRevisionReasonInput] = useState('');
  const [approvalNoteInput, setApprovalNoteInput] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // Full Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editObjective, setEditObjective] = useState('');
  const [editDepartmentId, setEditDepartmentId] = useState('');
  const [editPriority, setEditPriority] = useState<import('../types').TaskPriority>('Medium');
  const [editDeadline, setEditDeadline] = useState('');
  const [editStatus, setEditStatus] = useState<TaskStatus>('Not Started');
  const [editProgressPercent, setEditProgressPercent] = useState<number>(0);
  const [editChallengeCategory, setEditChallengeCategory] = useState<ChallengeCategory>('None');
  const [editChallengeDescription, setEditChallengeDescription] = useState('');
  const [editSupportNeeded, setEditSupportNeeded] = useState<string[]>([]);

  const startEditing = () => {
    if (!task) return;
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditObjective(task.objective);
    setEditDepartmentId(task.departmentId);
    setEditPriority(task.priority);
    setEditDeadline(task.deadline);
    setEditStatus(task.status);
    setEditProgressPercent(task.progressPercent);
    setEditChallengeCategory(task.challengeCategory || 'None');
    setEditChallengeDescription(task.challengeDescription || '');
    setEditSupportNeeded(task.supportNeeded || []);
    setIsEditing(true);
  };

  const handleSupportToggleEdit = (deptName: string) => {
    if ((editSupportNeeded || []).includes(deptName)) {
      setEditSupportNeeded((editSupportNeeded || []).filter((d) => d !== deptName));
    } else {
      setEditSupportNeeded([...(editSupportNeeded || []), deptName]);
    }
  };

  const isAdmin = currentUser?.role === 'admin';
  const isBizOpsDept = (departments || []).some(
    (d) =>
      ((currentUser?.departmentIds || []).includes(d.id) || (d.teamLeadIds || []).includes(currentUser?.id || '')) &&
      (d.id === 'dept-biz' || d.code?.toUpperCase() === 'BIZ' || d.name?.toLowerCase().includes('business operation'))
  );
  const isBizOps = currentUser?.role === 'business_ops' || isBizOpsDept;
  const canChangeDepartment = isAdmin || isBizOps;

  const handleSaveEditsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !editTitle.trim()) return;

    const finalDeptId = canChangeDepartment ? editDepartmentId : task.departmentId;
    const selectedDeptObj = departments.find((d) => d.id === finalDeptId);
    const isLocked = task.status === 'Approved' || task.status === 'Pending Approval';

    updateTask(task.id, {
      title: editTitle,
      description: editDescription,
      objective: editObjective,
      departmentId: finalDeptId,
      departmentName: selectedDeptObj ? selectedDeptObj.name : task.departmentName,
      priority: editPriority,
      deadline: editDeadline,
      status: isLocked ? task.status : editStatus,
      challengeCategory: editChallengeCategory,
      challengeDescription: editChallengeDescription,
      supportNeeded: editSupportNeeded,
    });

    setIsEditing(false);
  };

  if (!task) return null;

  const isOwner = canEditTask(task);
  const isApprover = canApproveTask(task);
  const deptHasLead = hasDepartmentLead(task.departmentId);
  const isActualOwner = task.ownerId === currentUser?.id;
  const isCrossDept = isCrossDeptSupport(task);
  const comments = getTaskComments(task.id);
  const activities = getTaskActivities(task.id);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    if (!delName) {
      setDelName(file.name);
    }
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') setDelType('PDF');
    else if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)) setDelType('Document');
    else if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) setDelType('Image');
    else if (['mp4', 'mov', 'webm', 'mkv'].includes(ext)) setDelType('Video');
    else if (['zip', 'tar', 'gz', 'csv', 'xlsx', 'pptx'].includes(ext)) setDelType('Other');
  };

  const handleAddDeliverableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    setUploadError(null);

    const fileName = (delName || selectedFile?.name || '').trim();
    if (!fileName) {
      setUploadError('Please select a file to upload or enter a deliverable name.');
      return;
    }

    if (deliverableMode === 'link' && !delUrl.trim()) {
      setUploadError('Please enter a valid document or share link URL.');
      return;
    }

    const nextIndex = (task.deliverables || []).length + 1;
    const effectiveCycle = targetCycle || task.weekId || activeWeek;
    const workdriveMeta = generateDeliverableWorkDriveMeta(task, fileName, nextIndex, effectiveCycle);

    setIsUploading(true);
    setUploadProgress(20);

    let finalUrl = delUrl.trim();
    let finalWorkdriveMeta = { ...workdriveMeta };
    let uploadSuccess = false;

    // If a physical file was chosen, upload directly to Cloudinary
    if (deliverableMode === 'upload' && selectedFile) {
      try {
        setUploadProgress(25);
        let directUploadSucceeded = false;
        const cleanRoot = (cloudinaryConfig.rootFolder || 'Deliverables').trim().replace(/^\/+|\/+$/g, '');
        const targetCycle = (workdriveMeta.cycleFolder || 'Cycle-Current').trim().replace(/^\/+|\/+$/g, '');
        const targetFolder = `${cleanRoot}/${targetCycle}`;

        const rawFileName = workdriveMeta.formattedFileName || selectedFile.name;
        const lastDot = rawFileName.lastIndexOf('.');
        const ext = lastDot !== -1 ? rawFileName.slice(lastDot + 1).toLowerCase() : '';
        const baseName = lastDot !== -1 ? rawFileName.slice(0, lastDot) : rawFileName;
        const autoExtTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'pdf', 'mp4', 'mov', 'webm', 'mp3', 'wav'];
        const publicId = autoExtTypes.includes(ext) ? baseName : rawFileName;

        // TIER 1: Direct signed upload to Cloudinary (bypasses server body buffering)
        try {
          const sigRes = await fetch('/api/cloudinary/signature', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              folder: targetFolder,
              publicId,
              cycleFolder: targetCycle,
              rootFolder: cleanRoot,
            }),
          });

          if (sigRes.ok) {
            const sigText = await sigRes.text();
            let sigData: any = null;
            try {
              sigData = JSON.parse(sigText);
            } catch {
              // Ignore non-JSON
            }

            if (sigData && sigData.success && sigData.uploadUrl) {
              setUploadProgress(50);
              const directForm = new FormData();
              directForm.append('file', selectedFile, rawFileName);
              directForm.append('folder', targetFolder);
              directForm.append('public_id', publicId);
              directForm.append('overwrite', 'true');
              directForm.append('timestamp', String(sigData.timestamp));
              if (sigData.apiKey) directForm.append('api_key', sigData.apiKey);
              if (sigData.signature) directForm.append('signature', sigData.signature);
              if (sigData.uploadPreset) directForm.append('upload_preset', sigData.uploadPreset);

              const cldDirectRes = await fetch(sigData.uploadUrl, {
                method: 'POST',
                body: directForm,
              });

              const cldDirectText = await cldDirectRes.text();
              let cldData: any = null;
              try {
                cldData = JSON.parse(cldDirectText);
              } catch {
                // Ignore parse error
              }

              if (cldDirectRes.ok && cldData && (cldData.secure_url || cldData.url)) {
                directUploadSucceeded = true;
                uploadSuccess = true;
                finalUrl = cldData.secure_url || cldData.url;
                finalWorkdriveMeta.provider = 'cloudinary';
                finalWorkdriveMeta.workdriveUrl = finalUrl;
                finalWorkdriveMeta.documentUrl = finalUrl;
                finalWorkdriveMeta.fileId = cldData.asset_id || cldData.public_id;
                finalWorkdriveMeta.publicId = cldData.public_id;
                finalWorkdriveMeta.resourceType = cldData.resource_type;
                finalWorkdriveMeta.format = cldData.format || ext;
                finalWorkdriveMeta.bytes = cldData.bytes || selectedFile.size;
                finalWorkdriveMeta.cycleFolder = targetCycle;
                finalWorkdriveMeta.folderPath = targetFolder;
                finalWorkdriveMeta.status = 'synced';
                finalWorkdriveMeta.syncedAt = new Date().toISOString();
                setUploadProgress(100);
              }
            }
          }

          // Fallback: If server signature was unavailable, sign directly in browser if API key & secret are in client config
          if (!directUploadSucceeded && cloudinaryConfig.cloudName && cloudinaryConfig.apiKey && cloudinaryConfig.apiSecret) {
            try {
              const timestamp = Math.floor(Date.now() / 1000);
              const overwrite = 'true';
              const paramsToSign: string[] = [];
              if (targetFolder) paramsToSign.push(`folder=${targetFolder}`);
              paramsToSign.push(`overwrite=${overwrite}`);
              if (publicId) paramsToSign.push(`public_id=${publicId}`);
              paramsToSign.push(`timestamp=${timestamp}`);
              const stringToSign = paramsToSign.join('&') + cloudinaryConfig.apiSecret.trim();

              const encoder = new TextEncoder();
              const hashBuffer = await window.crypto.subtle.digest('SHA-1', encoder.encode(stringToSign));
              const hashArray = Array.from(new Uint8Array(hashBuffer));
              const clientSig = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

              const clientDirectForm = new FormData();
              clientDirectForm.append('file', selectedFile, rawFileName);
              clientDirectForm.append('folder', targetFolder);
              clientDirectForm.append('public_id', publicId);
              clientDirectForm.append('overwrite', overwrite);
              clientDirectForm.append('timestamp', String(timestamp));
              clientDirectForm.append('api_key', cloudinaryConfig.apiKey.trim());
              clientDirectForm.append('signature', clientSig);

              const uploadEndpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudinaryConfig.cloudName.trim())}/auto/upload`;
              const clientRes = await fetch(uploadEndpoint, {
                method: 'POST',
                body: clientDirectForm,
              });

              const clientText = await clientRes.text();
              let clientData: any = null;
              try {
                clientData = JSON.parse(clientText);
              } catch {
                // Ignore parse error
              }

              if (clientRes.ok && clientData && (clientData.secure_url || clientData.url)) {
                directUploadSucceeded = true;
                uploadSuccess = true;
                finalUrl = clientData.secure_url || clientData.url;
                finalWorkdriveMeta.provider = 'cloudinary';
                finalWorkdriveMeta.workdriveUrl = finalUrl;
                finalWorkdriveMeta.documentUrl = finalUrl;
                finalWorkdriveMeta.fileId = clientData.asset_id || clientData.public_id;
                finalWorkdriveMeta.publicId = clientData.public_id;
                finalWorkdriveMeta.resourceType = clientData.resource_type;
                finalWorkdriveMeta.format = clientData.format || ext;
                finalWorkdriveMeta.bytes = clientData.bytes || selectedFile.size;
                finalWorkdriveMeta.cycleFolder = targetCycle;
                finalWorkdriveMeta.folderPath = targetFolder;
                finalWorkdriveMeta.status = 'synced';
                finalWorkdriveMeta.syncedAt = new Date().toISOString();
                setUploadProgress(100);
              }
            } catch (clientSignErr) {
              console.warn('Direct browser signature upload notice:', clientSignErr);
            }
          }
        } catch (directErr) {
          console.warn('Direct Cloudinary upload notice, trying server proxy fallback:', directErr);
        }

        // TIER 2: Fallback to server-side upload proxy (/api/cloudinary/upload)
        if (!directUploadSucceeded) {
          setUploadProgress(65);
          const formData = new FormData();
          formData.append('file', selectedFile);
          if (cloudinaryConfig.cloudName) formData.append('cloudName', cloudinaryConfig.cloudName);
          if (cloudinaryConfig.apiKey) formData.append('apiKey', cloudinaryConfig.apiKey);
          if (cloudinaryConfig.apiSecret) formData.append('apiSecret', cloudinaryConfig.apiSecret);
          if (cloudinaryConfig.uploadPreset) formData.append('uploadPreset', cloudinaryConfig.uploadPreset);
          formData.append('rootFolder', cloudinaryConfig.rootFolder || 'Deliverables');
          formData.append('cycleFolder', workdriveMeta.cycleFolder);
          formData.append('formattedFileName', workdriveMeta.formattedFileName);

          let uploadRes: Response | null = null;
          let rawText = '';

          for (let attempt = 1; attempt <= 2; attempt++) {
            try {
              uploadRes = await fetch('/api/cloudinary/upload', {
                method: 'POST',
                body: formData,
              });
              rawText = await uploadRes.text();
              if (uploadRes.ok && !rawText.toLowerCase().includes('<!doctype')) {
                break;
              }
            } catch (fetchErr) {
              if (attempt === 2) throw fetchErr;
              await new Promise((r) => setTimeout(r, 1200));
            }
          }

          let uploadData: any = null;
          try {
            uploadData = JSON.parse(rawText);
          } catch {
            const isHtml =
              rawText.toLowerCase().includes('<!doctype') ||
              rawText.toLowerCase().includes('<html') ||
              rawText.toLowerCase().includes('<body') ||
              rawText.includes('FUNCTION_INVOCATION_FAILED');
            throw new Error(
              isHtml
                ? 'Cloudinary server returned an HTML error. Verify Vercel environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).'
                : 'Server returned an invalid format.'
            );
          }

          setUploadProgress(90);

          if (uploadRes && uploadRes.ok && uploadData?.success && (uploadData.secureUrl || uploadData.documentUrl)) {
            uploadSuccess = true;
            finalUrl = uploadData.secureUrl || uploadData.documentUrl || uploadData.permalink || '';
            finalWorkdriveMeta.provider = 'cloudinary';
            finalWorkdriveMeta.workdriveUrl = finalUrl;
            finalWorkdriveMeta.documentUrl = finalUrl;
            finalWorkdriveMeta.fileId = uploadData.fileId || uploadData.publicId;
            finalWorkdriveMeta.publicId = uploadData.publicId;
            finalWorkdriveMeta.resourceType = uploadData.resourceType;
            finalWorkdriveMeta.format = uploadData.format;
            finalWorkdriveMeta.bytes = uploadData.sizeBytes;
            finalWorkdriveMeta.cycleFolder = uploadData.cycleFolder || workdriveMeta.cycleFolder;
            finalWorkdriveMeta.folderPath =
              uploadData.folderPath || `${cloudinaryConfig.rootFolder || 'Deliverables'}/${finalWorkdriveMeta.cycleFolder}`;
            finalWorkdriveMeta.status = 'synced';
            finalWorkdriveMeta.syncedAt = new Date().toISOString();
          } else {
            const warningMsg =
              uploadData?.error ||
              uploadData?.details ||
              (uploadRes?.status === 413
                ? 'File too large for direct upload.'
                : `Upload to Cloudinary failed (${uploadRes?.status || 'unknown'}).`);
            setUploadError(warningMsg);
            if (warningMsg.toLowerCase().includes('credentials')) {
              setShowQuickCloudinarySetup(true);
            }
          }
        }
      } catch (uploadErr: any) {
        setUploadError(uploadErr?.message || 'Network error during Cloudinary upload.');
      }

      // CRITICAL: If upload failed, do NOT save deliverable to the site!
      if (!uploadSuccess) {
        setIsUploading(false);
        setUploadProgress(0);
        return;
      }
    } else if (deliverableMode === 'link') {
      if (!finalUrl) {
        setUploadError('Please provide a valid document or share link.');
        setIsUploading(false);
        return;
      }
      finalWorkdriveMeta.provider = 'manual';
      finalWorkdriveMeta.workdriveUrl = finalUrl;
      finalWorkdriveMeta.documentUrl = finalUrl;
      finalWorkdriveMeta.status = 'manual';
    } else {
      setUploadError('Please select a file from your device to upload.');
      setIsUploading(false);
      return;
    }

    setUploadProgress(100);

    await addDeliverable(task.id, {
      name: fileName,
      url: finalUrl,
      type: delType,
      workdrive: finalWorkdriveMeta,
    });

    setIsUploading(false);
    setUploadProgress(0);
    setSelectedFile(null);
    setDelName('');
    setDelUrl('');
    setUploadError(null);
  };

  const handleCopyText = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedPathId(id);
    setTimeout(() => {
      setCopiedPathId(null);
    }, 2000);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300">Critical</span>;
      case 'High':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300">High</span>;
      case 'Medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">Medium</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Low</span>;
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'Approved':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Completed & Approved</span>;
      case 'Pending Approval':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Waiting for Approval</span>;
      case 'Needs Revision':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Needs Revision</span>;
      case 'In Progress':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> In Progress</span>;
      case 'Blocked':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> Blocked</span>;
      case 'Completed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Waiting for Approval</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Not Started</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-white">
        {/* Drawer Header */}
        <div className="p-3.5 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-[10px] sm:text-[11px] font-bold text-[#005CBD] dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/50 whitespace-nowrap">
                  {task.departmentName}
                </span>
                {getPriorityBadge(task.priority)}
                {getStatusBadge(task.status)}
                {task.archived && (
                  <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                    Archived
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white leading-snug break-words">{task.title}</h2>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Edit Task Button */}
              {(isOwner || currentUser.role === 'admin') && !task.archived && (
                <button
                  onClick={startEditing}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold bg-[#005CBD] hover:bg-[#0051B8] text-white transition-all shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Edit Task</span>
                </button>
              )}

              {/* Archive / Restore Button */}
              {(isOwner || currentUser.role === 'admin') && (
                <button
                  onClick={() => {
                    if (task.archived) {
                      restoreTask(task.id);
                    } else {
                      if (confirm('Archive this task? It will remain searchable & in historical logs.')) {
                        archiveTask(task.id);
                      }
                    }
                  }}
                  className="p-1.5 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title={task.archived ? 'Restore Task' : 'Archive Task'}
                >
                  {task.archived ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                </button>
              )}

              {/* Permanent Delete Button (Owner or Admin only) */}
              {(isOwner || currentUser.role === 'admin') && (
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to permanently delete "${task.title}"? This cannot be undone.`)) {
                      deleteTask(task.id);
                      onClose();
                    }
                  }}
                  className="p-1.5 border border-slate-200 dark:border-slate-700 text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                  title="Delete Task Permanently"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Owner & Meta line */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <img
                src={
                  task.ownerAvatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                }
                alt={task.ownerName}
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover shrink-0 ring-1 ring-slate-200 dark:ring-slate-700"
              />
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{task.ownerName}</span>
              {task.ownerId === currentUser?.id ? (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-[#005CBD] dark:text-blue-300">
                  You
                </span>
              ) : null}
              <span className="text-slate-400 dark:text-slate-600">•</span>
              <span className="text-slate-500 dark:text-slate-400">
                Deadline: <strong className="text-slate-800 dark:text-white">{task.deadline}</strong>
              </span>
            </div>

            {/* Quick Status Display & Changer */}
            {task.status === 'Approved' ? (
              <div className="flex items-center gap-1.5 self-start sm:self-auto px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold text-xs border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Completed & Approved (Locked)</span>
              </div>
            ) : task.status === 'Pending Approval' ? (
              <div className="flex items-center gap-1.5 self-start sm:self-auto px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 font-semibold text-xs border border-purple-200 dark:border-purple-800">
                <Clock className="w-3.5 h-3.5" />
                <span>Waiting for Approval (Locked)</span>
              </div>
            ) : isOwner && !task.archived ? (
              <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
                {isCrossDept && !isActualOwner && currentUser?.role !== 'admin' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    Cross-Dept Support
                  </span>
                )}
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Update Status:</span>
                <select
                  value={task.status}
                  onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                  className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-0.5 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#005CBD]"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Blocked">Blocked</option>
                  {task.status === 'Needs Revision' && (
                    <option value="Needs Revision" disabled>Needs Revision (Current)</option>
                  )}
                  <option value="Completed">Mark Completed (Submit for Approval)</option>
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 self-start sm:self-auto px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                <span>Read-Only View</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Callout Banners for Approvals, Auto-Approvals or Revisions */}
        {task.status === 'Needs Revision' && task.revisionReason && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 p-3.5 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Revision Requested by Team Lead</div>
              <div className="mt-0.5">{task.revisionReason}</div>
            </div>
          </div>
        )}

        {task.status === 'Approved' && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-900/60 p-3.5 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold flex items-center gap-2 flex-wrap">
                <span>Task Approved & Verified</span>
                {task.approvedBy?.includes('Auto-Approved') || task.approvedByName?.includes('Auto-Approved') || !deptHasLead ? (
                  <span className="text-[10px] bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    <span>Auto-Approved (No Team Lead in {task.departmentName})</span>
                  </span>
                ) : (
                  task.approvedByName && (
                    <span className="text-emerald-700 dark:text-emerald-300 font-medium">by {task.approvedByName}</span>
                  )
                )}
              </div>
              {task.approvalNote && (
                <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium mt-0.5">{task.approvalNote}</div>
              )}
            </div>
          </div>
        )}

        {isApprover && (task.status === 'Pending Approval' || task.status === 'Completed') && (
          <div className="bg-purple-50 dark:bg-purple-950/40 border-b border-purple-200 dark:border-purple-900/60 p-3.5 text-xs text-purple-900 dark:text-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>
                Task is pending your approval as <strong>Team Lead</strong> of {task.departmentName}.
              </span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                onClick={() => setShowApprovalModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Approve Task
              </button>
              <button
                onClick={() => setShowRevisionModal(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1"
              >
                <AlertTriangle className="w-3.5 h-3.5" /> Request Revision
              </button>
            </div>
          </div>
        )}

        {!isApprover && task.status === 'Pending Approval' && (
          <div className="bg-purple-50 dark:bg-purple-950/40 border-b border-purple-200 dark:border-purple-900/60 p-3.5 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Awaiting Team Lead Sign-off</div>
              <div className="mt-0.5 text-purple-800 dark:text-purple-300">
                This task has been submitted and is currently in the review queue for the Team Lead of <strong>{task.departmentName}</strong>.
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 bg-white dark:bg-slate-900 flex items-center gap-4 sm:gap-6 text-xs font-semibold text-slate-500 dark:text-slate-400 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'details' ? 'border-[#005CBD] dark:border-blue-400 text-[#005CBD] dark:text-blue-400 font-bold' : 'border-transparent hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Details & Planning
          </button>
          <button
            onClick={() => setActiveTab('deliverables')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'deliverables' ? 'border-[#005CBD] dark:border-blue-400 text-[#005CBD] dark:text-blue-400 font-bold' : 'border-transparent hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <span>Deliverables</span>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {(task.deliverables || []).length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'comments' ? 'border-[#005CBD] dark:border-blue-400 text-[#005CBD] dark:text-blue-400 font-bold' : 'border-transparent hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <span>Discussion</span>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {(comments || []).length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'history' ? 'border-[#005CBD] dark:border-blue-400 text-[#005CBD] dark:text-blue-400 font-bold' : 'border-transparent hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Activity Stream
          </button>
        </div>

        {/* Tab Content Body */}
        {activeTab === 'comments' ? (
          <div className="p-2 sm:p-4 flex-1 min-h-0 flex flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-950/20">
            <TaskDiscussionPanel taskId={task.id} taskTitle={task.title} />
          </div>
        ) : (
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Progress Indicator */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <span>Task Progress</span>
                  <span className="text-[#005CBD] dark:text-blue-400 font-bold">{task.progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#005CBD] dark:bg-blue-500 h-full rounded-full transition-all"
                    style={{ width: `${task.progressPercent}%` }}
                  />
                </div>
                <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <Info className="w-3.5 h-3.5 text-[#005CBD] dark:text-blue-400 shrink-0" />
                  <span>Progress updates automatically based on the task status ({task.status}).</span>
                </div>
              </div>

              {/* Objective & Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Objective</h4>
                  <p className="text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 p-3 rounded-lg leading-relaxed">
                    {task.objective || 'No explicit objective specified.'}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Detailed Context</h4>
                  <p className="text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 p-3 rounded-lg leading-relaxed">
                    {task.description || 'No detailed description provided.'}
                  </p>
                </div>
              </div>

              {/* Planning & Support Needed */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Planning & Timeline</h4>
                  <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Start Date:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{task.startDate || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Deadline:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{task.deadline}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Cycle / Period:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{task.weekId || 'Active Cycle'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Cross-Dept Support Needed</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(task.supportNeeded || []).length === 0 ? (
                      <span className="text-xs text-slate-400 dark:text-slate-500 italic">No external support requested</span>
                    ) : (
                      (task.supportNeeded || []).map((deptName) => (
                        <span
                          key={deptName}
                          className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/50 flex items-center gap-1"
                        >
                          <Tag className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          {deptName}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Challenges Section */}
              {(task.challengeDescription || (task.challengeCategory && task.challengeCategory !== 'None')) && (
                <div className="bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-900/60 p-4 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                    <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Challenge / Blocker Logged</span>
                  </div>
                  <p className="text-xs text-amber-900/90 dark:text-amber-300 leading-relaxed font-medium">
                    {task.challengeDescription || `Categorized under: ${task.challengeCategory}`}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'deliverables' && (() => {
            const nextDeliverableIndex = (task.deliverables || []).length + 1;
            const currentFileNamePreview = (delName || selectedFile?.name || 'deliverable.pdf').trim();
            const effectiveCycle = targetCycle || task.weekId || activeWeek;
            const liveWorkDrivePreview = generateDeliverableWorkDriveMeta(task, currentFileNamePreview, nextDeliverableIndex, effectiveCycle);
            const isCloudinaryConfigured = Boolean(
              cloudinaryConfig.cloudName &&
                ((cloudinaryConfig.apiKey && cloudinaryConfig.apiSecret) || cloudinaryConfig.uploadPreset)
            );

            return (
              <div className="space-y-6">
                {/* Deliverables Overview Banner */}
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50/40 to-slate-50 dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900 border border-blue-200/80 dark:border-blue-900/50 p-4 rounded-xl space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#005CBD] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        <Cloud className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">Task Deliverables</h4>
                          {isCloudinaryConfigured ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Ready to Upload
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowQuickCloudinarySetup(!showQuickCloudinarySetup)}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-200 transition-colors flex items-center gap-1"
                            >
                              <AlertTriangle className="w-3 h-3" /> Connect File Upload
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Upload files or attach links to share your completed work with your team.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Simple folder summary */}
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 flex-wrap">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Saved under:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Folder className="w-3.5 h-3.5 text-amber-500" />
                      {task.departmentName}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span className="font-semibold text-[#005CBD] dark:text-blue-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#005CBD] dark:text-blue-400" />
                      {effectiveCycle}
                    </span>
                  </div>

                  {/* Quick Inline Cloudinary Setup Drawer if not configured yet */}
                  {(!isCloudinaryConfigured || showQuickCloudinarySetup) && (
                    <div className="p-3.5 bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-700 rounded-xl space-y-3 text-xs animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                          <Cloud className="w-4 h-4 text-[#005CBD]" />
                          <span>Connect Cloudinary Storage</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {currentUser.role === 'admin' && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                setActiveView('admin');
                              }}
                              className="text-[11px] text-[#005CBD] dark:text-blue-400 hover:underline font-semibold"
                            >
                              Open Full Admin Settings →
                            </button>
                          )}
                          {isCloudinaryConfigured && (
                            <button
                              type="button"
                              onClick={() => setShowQuickCloudinarySetup(false)}
                              className="text-slate-400 hover:text-slate-600 p-0.5"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Paste your <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">CLOUDINARY_URL</code> (e.g. <code className="font-mono text-[10px]">cloudinary://API_KEY:API_SECRET@CLOUD_NAME</code>) or enter your Cloud Name and API Key/Secret (or Unsigned Upload Preset) below:
                      </p>

                      <div>
                        <input
                          type="text"
                          placeholder="Paste CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name (Auto-fills fields)"
                          value={quickCloudinaryUrl}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQuickCloudinaryUrl(val);
                            const cleaned = val.trim().replace(/^CLOUDINARY_URL=/i, '').replace(/^["']|["']$/g, '');
                            if (cleaned.toLowerCase().startsWith('cloudinary://')) {
                              const without = cleaned.slice('cloudinary://'.length);
                              const atIdx = without.lastIndexOf('@');
                              if (atIdx !== -1) {
                                const creds = without.slice(0, atIdx);
                                const cName = without.slice(atIdx + 1).split('/')[0].trim();
                                const colIdx = creds.indexOf(':');
                                if (colIdx !== -1) {
                                  setQuickCloudName(cName);
                                  setQuickApiKey(creds.slice(0, colIdx).trim());
                                  setQuickApiSecret(creds.slice(colIdx + 1).trim());
                                }
                              }
                            }
                          }}
                          className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                        <input
                          type="text"
                          placeholder="Cloud Name *"
                          value={quickCloudName}
                          onChange={(e) => setQuickCloudName(e.target.value)}
                          className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                        <input
                          type="text"
                          placeholder="API Key"
                          value={quickApiKey}
                          onChange={(e) => setQuickApiKey(e.target.value)}
                          className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                        <input
                          type="password"
                          placeholder="API Secret"
                          value={quickApiSecret}
                          onChange={(e) => setQuickApiSecret(e.target.value)}
                          className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                        <input
                          type="text"
                          placeholder="Or Unsigned Preset"
                          value={quickUploadPreset}
                          onChange={(e) => setQuickUploadPreset(e.target.value)}
                          className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={quickSavingConfig || (!quickCloudName.trim() && !quickCloudinaryUrl.trim())}
                          onClick={async () => {
                            setQuickSavingConfig(true);
                            setUploadError(null);
                            await updateCloudinaryConfig({
                              cloudinaryUrl: quickCloudinaryUrl.trim() || undefined,
                              cloudName: quickCloudName.trim(),
                              apiKey: quickApiKey.trim(),
                              apiSecret: quickApiSecret.trim(),
                              uploadPreset: quickUploadPreset.trim(),
                              enabled: true,
                              connected: true,
                            });
                            setQuickSavingConfig(false);
                            setShowQuickCloudinarySetup(false);
                          }}
                          className="px-3.5 py-1.5 bg-[#005CBD] hover:bg-[#0051B8] disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{quickSavingConfig ? 'Saving...' : 'Save Cloudinary Credentials'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload Error Banner */}
                {uploadError && (
                  <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-xs text-red-800 dark:text-red-300 flex items-start justify-between gap-3 animate-in fade-in">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <div className="font-bold">Upload Failed — Not Added to Site</div>
                        <div className="text-[11px] leading-relaxed">{uploadError}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadError(null)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 p-1 rounded-md"
                      title="Dismiss notice"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Add Deliverable Form */}
                {isOwner && !task.archived && (
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 rounded-xl space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                        <UploadCloud className="w-4 h-4 text-[#005CBD] dark:text-blue-400" />
                        <span>Add Deliverable</span>
                      </h4>

                      {/* Switch between file upload and direct link */}
                      <div className="flex items-center bg-slate-200/80 dark:bg-slate-700/80 p-0.5 rounded-lg text-[11px]">
                        <button
                          type="button"
                          onClick={() => setDeliverableMode('upload')}
                          className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                            deliverableMode === 'upload'
                              ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          Upload File
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeliverableMode('link')}
                          className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                            deliverableMode === 'link'
                              ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          Share Link
                        </button>
                      </div>
                    </div>

                    <form onSubmit={handleAddDeliverableSubmit} className="space-y-3">
                      {deliverableMode === 'upload' ? (
                        <div className="space-y-3">
                          {/* File Drop Area */}
                          <label
                            className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                              selectedFile
                                ? 'border-emerald-500/80 bg-emerald-50/40 dark:bg-emerald-950/20'
                                : 'border-slate-300 dark:border-slate-600 hover:border-[#005CBD] dark:hover:border-blue-400 bg-white dark:bg-slate-900/80'
                            }`}
                          >
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleFileSelect(e.target.files[0]);
                                }
                              }}
                            />
                            <UploadCloud
                              className={`w-7 h-7 mb-1.5 ${
                                selectedFile ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                              }`}
                            />
                            {selectedFile ? (
                              <div className="text-center">
                                <span className="font-bold text-xs text-slate-800 dark:text-white block">
                                  {selectedFile.name}
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {(selectedFile.size / 1024).toFixed(1)} KB • Click or drop another file to replace
                                </span>
                              </div>
                            ) : (
                              <div className="text-center">
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                                  Drop your file here, or{' '}
                                  <span className="text-[#005CBD] dark:text-blue-400 underline">browse</span>
                                </span>
                                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                  PDF, Word, Excel, Images, Videos, or ZIP files supported
                                </span>
                              </div>
                            )}
                          </label>

                          {/* Options grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                File Name (Optional)
                              </label>
                              <input
                                type="text"
                                placeholder={selectedFile?.name || 'e.g. Design Deck'}
                                value={delName}
                                onChange={(e) => setDelName(e.target.value)}
                                className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#005CBD]"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                Week
                              </label>
                              <select
                                value={effectiveCycle}
                                onChange={(e) => setTargetCycle(e.target.value)}
                                className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-[#005CBD]"
                              >
                                {(weeks || []).map((w) => (
                                  <option key={w.id} value={w.id}>
                                    {w.id} {w.id === activeWeek ? '• Current Week' : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                File Type
                              </label>
                              <select
                                value={delType}
                                onChange={(e) => setDelType(e.target.value as DeliverableType)}
                                className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#005CBD]"
                              >
                                <option value="PDF">PDF Document</option>
                                <option value="Document">Word / Document</option>
                                <option value="Image">Design / Image</option>
                                <option value="Video">Video</option>
                                <option value="External Link">Web Link</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <input
                            type="text"
                            placeholder="Title (e.g. Final Report)"
                            value={delName}
                            onChange={(e) => setDelName(e.target.value)}
                            required
                            className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#005CBD]"
                          />
                          <input
                            type="url"
                            placeholder="Paste Link (https://...)"
                            value={delUrl}
                            onChange={(e) => setDelUrl(e.target.value)}
                            required
                            className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#005CBD]"
                          />
                          <select
                            value={delType}
                            onChange={(e) => setDelType(e.target.value as DeliverableType)}
                            className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#005CBD]"
                          >
                            <option value="PDF">PDF Document</option>
                            <option value="Document">Word / Google Doc</option>
                            <option value="Image">Image / Design</option>
                            <option value="Video">Video</option>
                            <option value="External Link">Web Link</option>
                            <option value="Other">Other File</option>
                          </select>
                        </div>
                      )}

                      {/* Upload Progress Bar */}
                      {isUploading && (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                            <span className="flex items-center gap-1.5">
                              <Cloud className="w-3.5 h-3.5 text-[#005CBD] animate-pulse" />
                              Uploading file...
                            </span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#005CBD] transition-all duration-200"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={isUploading || (deliverableMode === 'upload' && !selectedFile)}
                          className="bg-[#005CBD] hover:bg-[#0051B8] disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>
                            {isUploading
                              ? 'Uploading...'
                              : deliverableMode === 'upload'
                              ? 'Upload & Save File'
                              : 'Save Link'}
                          </span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Deliverables List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Attached Deliverables ({ (task.deliverables || []).length })</span>
                    </h4>
                  </div>

                  {(task.deliverables || []).length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-400 dark:text-slate-500 space-y-1">
                      <Cloud className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                      <div className="font-semibold text-slate-600 dark:text-slate-400">No deliverables attached yet</div>
                      <div>Upload a file or add a link above to share your work.</div>
                    </div>
                  ) : (
                    (task.deliverables || []).map((del) => {
                      const formattedName = del.workdrive?.formattedFileName || del.name;
                      const folderPath = del.workdrive?.folderPath || `${cloudinaryConfig.rootFolder || 'Deliverables'}/${getWorkDriveCycleFolderName(task.weekId || activeWeek)}`;
                      const isCopied = copiedPathId === del.id;
                      const isCloudinaryAsset =
                        del.workdrive?.provider === 'cloudinary' ||
                        (del.url && del.url.includes('cloudinary.com')) ||
                        (del.workdrive?.documentUrl && del.workdrive.documentUrl.includes('cloudinary.com'));

                      return (
                        <div
                          key={del.id}
                          className="p-3.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2.5 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-xs"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#005CBD] dark:text-blue-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                    {del.name}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
                                    {del.type}
                                  </span>
                                  {isCloudinaryAsset ? (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                                      <Check className="w-3 h-3" /> Uploaded File
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                      <ExternalLink className="w-3 h-3" /> Shared Link
                                    </span>
                                  )}
                                </div>

                                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                                  <span>Uploaded by {del.uploadedBy}</span>
                                  {del.uploadedAt && (
                                    <>
                                      <span>•</span>
                                      <span>{new Date(del.uploadedAt).toLocaleDateString()}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {(() => {
                                const documentUrl = del.workdrive?.documentUrl || del.url || del.workdrive?.workdriveUrl;
                                const validDocUrl = resolveWorkDriveOpenUrl(
                                  documentUrl,
                                  del.workdrive?.publicId,
                                  del.workdrive?.formattedFileName || del.name
                                );

                                return (
                                  <div className="flex items-center gap-1.5">
                                    {validDocUrl && (
                                      <a
                                        href={validDocUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-3 py-1.5 bg-[#005CBD] hover:bg-[#0051B8] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                                        title="Open deliverable file in a new tab"
                                      >
                                        <FileText className="w-3.5 h-3.5" />
                                        <span>Open Document</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    )}
                                    {validDocUrl && isCloudinaryAsset && (
                                      <a
                                        href={`${validDocUrl}${validDocUrl.includes('?') ? '&' : '?'}download=true`}
                                        className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center transition-colors border border-slate-200 dark:border-slate-650"
                                        title="Download deliverable file"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                  </div>
                                );
                              })()}
                              {isOwner && (
                                <button
                                  type="button"
                                  onClick={() => removeDeliverable(task.id, del.id)}
                                  className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                                  title="Delete deliverable"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })()}

          {activeTab === 'history' && (
            <div className="space-y-6">
              {/* Activity Timeline Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-4 h-4 text-[#005CBD] dark:text-blue-400" />
                    <span>Activity Timeline</span>
                  </h4>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-bold">
                    {(activities || []).length} Recorded Events
                  </span>
                </div>

                {(activities || []).length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl">
                    No activity history recorded yet.
                  </div>
                ) : (
                  <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-4 space-y-4 pl-5 py-2">
                    {(activities || []).map((act) => {
                      let icon = <History className="w-3.5 h-3.5 text-slate-500" />;
                      let bgDot = 'bg-slate-500';

                      if (act.type === 'approved') {
                        icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
                        bgDot = 'bg-emerald-500';
                      } else if (act.type === 'revision_requested') {
                        icon = <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
                        bgDot = 'bg-amber-500';
                      } else if (act.type === 'created') {
                        icon = <Plus className="w-3.5 h-3.5 text-[#005CBD] dark:text-blue-400" />;
                        bgDot = 'bg-[#005CBD]';
                      } else if (act.type === 'comment_added') {
                        icon = <MessageSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />;
                        bgDot = 'bg-indigo-500';
                      } else if (act.type === 'deliverable_uploaded') {
                        icon = <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
                        bgDot = 'bg-blue-500';
                      } else if (act.type === 'status_changed') {
                        icon = <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
                        bgDot = 'bg-purple-500';
                      }

                      return (
                        <div key={act.id} className="relative text-xs space-y-1 group">
                          <div
                            className={`absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full ${bgDot} ring-4 ring-white dark:ring-slate-900 flex items-center justify-center text-white`}
                          >
                            <span className="w-1.5 h-1.5 bg-white rounded-full" />
                          </div>

                          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-2xs flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-700 shrink-0">{icon}</div>
                            <div className="flex-1">
                              <div className="font-semibold text-slate-800 dark:text-slate-200 leading-snug">{act.details}</div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-2 mt-1">
                                <span className="font-bold text-slate-600 dark:text-slate-300">{act.userName}</span>
                                <span>•</span>
                                <span>{new Date(act.timestamp).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Task History Audit Trail Table */}
              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  Task Audit Log & Lifecycle
                </h4>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700 text-[11px]">
                      <tr>
                        <th className="p-2.5">Timestamp</th>
                        <th className="p-2.5">User</th>
                        <th className="p-2.5">Action Type</th>
                        <th className="p-2.5">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {activities.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                          <td className="p-2.5 text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                            {new Date(a.timestamp).toLocaleString()}
                          </td>
                          <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">{a.userName}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded text-[10px] uppercase">
                              {a.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-700 dark:text-slate-300">{a.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Approve Completed Task
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              You are approving <strong>"{task.title}"</strong> for {task.departmentName}.
            </p>
            <textarea
              rows={3}
              placeholder="Optional approval note or feedback for the team member..."
              value={approvalNoteInput}
              onChange={(e) => setApprovalNoteInput(e.target.value)}
              className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  approveTask(task.id, approvalNoteInput);
                  setShowApprovalModal(false);
                }}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revision Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              Request Task Revision
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Provide actionable guidance on what needs modification before this task can be approved.
            </p>
            <textarea
              rows={3}
              required
              placeholder="e.g. Please update the architecture document to address high-throughput cache failovers."
              value={revisionReasonInput}
              onChange={(e) => setRevisionReasonInput(e.target.value)}
              className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRevisionModal(false)}
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!revisionReasonInput.trim()) return;
                  requestRevision(task.id, revisionReasonInput);
                  setShowRevisionModal(false);
                }}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                Send Back for Revision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal Overlay */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-xs">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#005CBD] text-white flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Edit Task Details</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Update operational parameters, status, or challenges.</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEditsSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* Title */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-[#005CBD]"
                />
              </div>

              {/* Department & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">Department</label>
                    {!canChangeDepartment && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 font-medium">
                        <Lock className="w-3 h-3 text-slate-400" /> Locked (Admin/BizOps only)
                      </span>
                    )}
                  </div>
                  {canChangeDepartment ? (
                    <select
                      value={editDepartmentId}
                      onChange={(e) => setEditDepartmentId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-[#005CBD]"
                    >
                      {departments
                        .filter((d) => !d.archived)
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.code})
                          </option>
                        ))}
                    </select>
                  ) : (
                    <div className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-medium text-xs flex items-center justify-between cursor-not-allowed">
                      <span>{departments.find((d) => d.id === task.departmentId)?.name || task.departmentName}</span>
                      <span className="text-[10px] text-slate-400 bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                        Fixed
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Priority Level</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-[#005CBD]"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Status & Automated Progress */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Workflow Status
                  </label>
                  {task.status === 'Pending Approval' || task.status === 'Approved' ? (
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs">
                      <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span>{task.status}</span>
                      </div>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1">
                        Locked during review/approval. Cannot be manually changed.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-[#005CBD]"
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Blocked">Blocked</option>
                        <option value="Completed">Completed (Submit for Approval)</option>
                        {task.status === 'Needs Revision' && (
                          <option value="Needs Revision">Needs Revision</option>
                        )}
                      </select>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Setting to Completed automatically queues task for Team Lead review.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300 mb-1">
                    <span className="text-xs">Progress (Automated)</span>
                    <span className="text-xs text-[#005CBD] dark:text-blue-400 font-bold">
                      {editStatus === 'Approved' ? 100 : editStatus === 'Pending Approval' ? 90 : editStatus === 'Needs Revision' ? 60 : editStatus === 'In Progress' ? 50 : editStatus === 'Blocked' ? 25 : editStatus === 'Completed' ? 90 : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden mt-3">
                    <div
                      className="h-full bg-[#005CBD] transition-all duration-300 rounded-full"
                      style={{
                        width: `${editStatus === 'Approved' ? 100 : editStatus === 'Pending Approval' ? 90 : editStatus === 'Needs Revision' ? 60 : editStatus === 'In Progress' ? 50 : editStatus === 'Blocked' ? 25 : editStatus === 'Completed' ? 90 : 0}%`
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                    Progress is automatically calculated from task workflow state.
                  </span>
                </div>
              </div>

              {/* Objective & Description */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Core Objective</label>
                <input
                  type="text"
                  value={editObjective}
                  onChange={(e) => setEditObjective(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005CBD]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005CBD]"
                />
              </div>

              {/* Deadline */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Deadline Date</label>
                <input
                  type="date"
                  required
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005CBD]"
                />
              </div>

              {/* Challenge & Blockers */}
              <div className="bg-amber-50/40 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    Challenges / Blockers <span className="font-normal text-slate-400 dark:text-slate-500">(Optional)</span>
                  </label>
                  <div className="group relative inline-flex items-center">
                    <button
                      type="button"
                      className="p-0.5 text-slate-400 hover:text-[#005CBD] rounded-full transition-colors focus:outline-none"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                    <div className="hidden group-hover:block absolute left-6 -top-2 z-50 w-64 p-2.5 bg-slate-900 text-white text-[11px] rounded-lg shadow-xl leading-snug">
                      <p className="font-medium">
                        Describe any obstacles, cross-team dependencies, technical roadblocks, or staffing constraints impacting this task.
                      </p>
                      <div className="absolute -left-1 top-3 w-2 h-2 bg-slate-900 rotate-45" />
                    </div>
                  </div>
                </div>

                <textarea
                  rows={2}
                  placeholder="Describe any active or anticipated challenge or blocker..."
                  value={editChallengeDescription}
                  onChange={(e) => {
                    setEditChallengeDescription(e.target.value);
                    setEditChallengeCategory(e.target.value.trim() ? 'Technical' : 'None');
                  }}
                  className="w-full px-3 py-2 border border-amber-200 dark:border-amber-900/60 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 leading-relaxed"
                />
              </div>

              {/* Support Needed */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Request Cross-Departmental Support</label>
                <div className="flex flex-wrap gap-2">
                  {departments
                    .filter((d) => !d.archived)
                    .map((dept) => {
                      const isSelected = (editSupportNeeded || []).includes(dept.name);
                      return (
                        <button
                          key={dept.id}
                          type="button"
                          onClick={() => handleSupportToggleEdit(dept.name)}
                          className={`px-3 py-1.5 rounded-xl border font-semibold transition-all ${
                            isSelected
                              ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 shadow-2xs'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          + {dept.name}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#005CBD] hover:bg-[#0051B8] text-white rounded-xl font-bold shadow-md"
                >
                  Save Task Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
