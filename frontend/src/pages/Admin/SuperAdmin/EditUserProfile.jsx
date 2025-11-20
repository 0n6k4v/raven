import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FiEdit, FiPlus, FiChevronLeft } from 'react-icons/fi'
import { FaCamera, FaTrash, FaUpload } from 'react-icons/fa'
import ProfileCamera from '../../../components/Admin/SuperAdmin/UserProfile.jsx/ProfileCamera'

// ==================== CONSTANTS ====================

const BASE_URL = `${import.meta.env.VITE_API_URL}/api`
const TITLE_OPTIONS = ['นาย', 'นาง', 'นางสาว']
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// ==================== UTILS ====================

const fetchJson = async (url, options = {}) => {
  const res = await fetch(url, options)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`Fetch error: ${res.status} ${res.statusText} ${text}`)
    err.status = res.status
    throw err
  }
  return res.json()
}

const validateImageFile = (file) => {
  if (!file) return { valid: false, error: 'ไม่พบไฟล์' }
  
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { valid: false, error: 'รองรับเฉพาะไฟล์ JPG, PNG, และ WEBP เท่านั้น' }
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'ขนาดไฟล์ต้องไม่เกิน 5MB' }
  }
  
  return { valid: true }
}

const getInitial = (name) => name ? name[0].toUpperCase() : ''

// ==================== CUSTOM HOOKS ====================

const useClickOutside = (handler) => {
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        handler()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handler])

  return ref
}

// ==================== Components ====================

const ProfileImage = ({ src, alt, initial, size = 'md', onClick }) => {
  const sizeClasses = {
    sm: 'w-16 h-16 text-2xl',
    md: 'w-24 h-24 text-4xl',
    lg: 'w-32 h-32 text-6xl'
  }

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-200 bg-gray-100`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      aria-label={onClick ? 'ดูรูปโปรไฟล์แบบเต็มหน้าจอ' : undefined}
    >
      {src ? (
        <img 
          src={src} 
          alt={alt || 'โปรไฟล์'} 
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="font-bold text-blue-500" aria-label={`ตัวอักษรเริ่มต้น ${initial}`}>
          {initial}
        </span>
      )}
    </div>
  )
}

const ImageMenu = ({ 
  onUpload, 
  onOpenCamera, 
  onRemove, 
  hasImage, 
  onClose 
}) => {
  const menuRef = useClickOutside(onClose)

  return (
    <div 
      ref={menuRef}
      className="absolute top-10 right-0 bg-white shadow-lg rounded-md py-1 z-10 w-36 border border-gray-200"
      role="menu"
      aria-label="ตัวเลือกรูปโปรไฟล์"
    >
      <label 
        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
        role="menuitem"
      >
        <FaUpload className="mr-2" size={14} aria-hidden="true" />
        <span>อัปโหลดรูป</span>
        <input
          type="file"
          accept={ALLOWED_FILE_TYPES.join(',')}
          className="sr-only"
          onChange={onUpload}
          aria-label="อัปโหลดรูปโปรไฟล์"
        />
      </label>
      
      <button
        type="button"
        onClick={onOpenCamera}
        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors w-full text-left"
        role="menuitem"
        aria-label="ถ่ายรูปโปรไฟล์"
      >
        <FaCamera className="mr-2" size={14} aria-hidden="true" />
        <span>ถ่ายรูป</span>
      </button>
      
      {hasImage && (
        <button
          type="button"
          onClick={onRemove}
          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 text-left transition-colors"
          role="menuitem"
        >
          <FaTrash className="mr-2" size={14} aria-hidden="true" />
          <span>ลบรูปโปรไฟล์</span>
        </button>
      )}
    </div>
  )
}

const FormInput = ({ 
  id,
  label, 
  name, 
  type = 'text', 
  value, 
  onChange, 
  placeholder,
  autoComplete,
  required = false,
  error
}) => (
  <div className="space-y-1">
    <label htmlFor={id || name} className="block text-sm font-medium text-gray-700">
      {label}
      {required && <span className="text-red-500 ml-1" aria-label="จำเป็น">*</span>}
    </label>
    <input
      id={id || name}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={autoComplete}
      required={required}
      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow ${
        error ? 'border-red-500' : 'border-gray-300'
      }`}
      aria-invalid={error ? 'true' : 'false'}
      aria-describedby={error ? `${(id || name)}-error` : undefined}
    />
    {error && (
      <p id={`${(id || name)}-error`} className="text-sm text-red-600" role="alert">
        {error}
      </p>
    )}
  </div>
)

const FormSelect = ({ 
  id,
  label, 
  name, 
  value, 
  onChange, 
  options, 
  required = false,
  error 
}) => (
  <div className="space-y-1">
    <label htmlFor={id || name} className="block text-sm font-medium text-gray-700">
      {label}
      {required && <span className="text-red-500 ml-1" aria-label="จำเป็น">*</span>}
    </label>
    <select
      id={id || name}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow ${
        error ? 'border-red-500' : 'border-gray-300'
      }`}
      aria-invalid={error ? 'true' : 'false'}
      aria-describedby={error ? `${(id || name)}-error` : undefined}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && (
      <p id={`${(id || name)}-error`} className="text-sm text-red-600" role="alert">
        {error}
      </p>
    )}
  </div>
)

// ==================== Presentational Layer ====================
const DesktopLayout = ({ 
  formData, 
  handleChange, 
  handleSubmit, 
  handleCancel, 
  roles, 
  imageHandlers,
  profilePreview,
  formErrors 
  , submitting
}) => {
  const [showImageMenu, setShowImageMenu] = useState(false)
  
  const titleOptions = [
    { value: '', label: 'เลือกคำนำหน้าชื่อ' },
    ...TITLE_OPTIONS.map(title => ({ value: title, label: title }))
  ]
  
  const roleOptions = [
    { value: '', label: 'เลือกประเภทผู้ใช้' },
    ...roles.map(role => ({ value: role.id, label: role.role_name }))
  ]
  
  const statusOptions = [
    { value: 'true', label: 'เปิดใช้งาน' },
    { value: 'false', label: 'ปิดใช้งาน' }
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 flex items-center flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="bg-blue-50 p-2 rounded-lg mr-3">
          <FiEdit size={20} className="text-blue-600" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-semibold text-gray-900">แก้ไขโปรไฟล์</h1>
      </div>

      {/* Form Container */}
      <div className="flex-1 overflow-auto py-6">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* Profile Header */}
              <div className="flex items-center pb-6 border-b border-gray-200">
                <div className="mr-4 relative">
                  <ProfileImage
                    src={profilePreview}
                    initial={getInitial(formData.firstname)}
                    size="sm"
                  />
                  
                  <div className="absolute -bottom-1 -right-1">
                    <button 
                      type="button"
                      onClick={() => setShowImageMenu(!showImageMenu)}
                      className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      aria-label="เปลี่ยนรูปโปรไฟล์"
                      aria-expanded={showImageMenu}
                      aria-haspopup="true"
                    >
                      <FiPlus className="text-sm" aria-hidden="true" />
                    </button>
                    
                    {showImageMenu && (
                      <ImageMenu
                        onUpload={(e) => {
                          imageHandlers.handleImageChange(e)
                          setShowImageMenu(false)
                        }}
                        onOpenCamera={() => {
                          imageHandlers.openCamera()
                          setShowImageMenu(false)
                        }}
                        onRemove={() => {
                          imageHandlers.handleRemoveImage()
                          setShowImageMenu(false)
                        }}
                        hasImage={!!profilePreview}
                        onClose={() => setShowImageMenu(false)}
                      />
                    )}
                  </div>
                </div>
                
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {formData.title} {formData.firstname} {formData.lastname}
                  </h2>
                  <p className="text-sm text-gray-600">{formData.email}</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormSelect
                  label="คำนำหน้าชื่อ"
                  id="title-desktop"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  options={titleOptions}
                  required
                  error={formErrors.title}
                />
                
                <FormInput
                  label="อีเมล์"
                  id="email-desktop"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                  error={formErrors.email}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  label="ชื่อจริง"
                  id="firstname-desktop"
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleChange}
                  autoComplete="given-name"
                  required
                  error={formErrors.firstname}
                />
                
                <FormInput
                  label="นามสกุล"
                  id="lastname-desktop"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleChange}
                  autoComplete="family-name"
                  required
                  error={formErrors.lastname}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  label="รหัสผ่าน (ถ้าไม่เปลี่ยนให้เว้นว่าง)"
                  id="password-desktop"
                  name="password"
                  type="password"
                  value={formData.password || ''}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  error={formErrors.password}
                />
                
                <FormInput
                  label="แผนก"
                  id="department-desktop"
                  name="department"
                  value={formData.department || ''}
                  onChange={handleChange}
                  autoComplete="organization"
                  error={formErrors.department}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormSelect
                  label="ประเภทผู้ใช้"
                  id="role_id-desktop"
                  name="role_id"
                  value={formData.role_id}
                  onChange={handleChange}
                  options={roleOptions}
                  required
                  error={formErrors.role_id}
                />
                
                <FormSelect
                  label="สถานะ"
                  id="is_active-desktop"
                  name="is_active"
                  value={formData.is_active ? 'true' : 'false'}
                  onChange={e => handleChange({ target: { name: 'is_active', value: e.target.value === 'true' } })}
                  options={statusOptions}
                  required
                  error={formErrors.is_active}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

const MobileLayout = ({ 
  formData, 
  handleChange, 
  handleSubmit, 
  handleCancel, 
  roles, 
  imageHandlers,
  profilePreview,
  formErrors 
  , submitting
}) => {
  const [fullScreen, setFullScreen] = useState(false)
  const [showImageMenu, setShowImageMenu] = useState(false)
  
  const titleOptions = [
    { value: '', label: 'เลือกคำนำหน้าชื่อ' },
    ...TITLE_OPTIONS.map(title => ({ value: title, label: title }))
  ]
  
  const roleOptions = [
    { value: '', label: 'เลือกประเภทผู้ใช้' },
    ...roles.map(role => ({ value: role.id, label: role.role_name }))
  ]
  
  const statusOptions = [
    { value: 'true', label: 'เปิดใช้งาน' },
    { value: 'false', label: 'ปิดใช้งาน' }
  ]

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white px-4 py-4 flex items-center shadow-sm sticky top-0 z-10">
        <button 
          onClick={handleCancel}
          className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="กลับ"
        >
          <FiChevronLeft size={24} aria-hidden="true" />
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-gray-900 pr-10">
          แก้ไขโปรไฟล์
        </h1>
      </header>

      {/* Profile Photo Section */}
      <div className="flex justify-center mt-8 mb-6">
        <div className="relative">
          <ProfileImage
            src={profilePreview}
            initial={getInitial(formData.firstname)}
            size="md"
            onClick={() => setFullScreen(true)}
          />
          
          <div className="absolute bottom-0 right-0">
            <button 
              type="button"
              onClick={() => setShowImageMenu(!showImageMenu)}
              className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="เปลี่ยนรูปโปรไฟล์"
              aria-expanded={showImageMenu}
              aria-haspopup="true"
            >
              <FiPlus className="text-lg" aria-hidden="true" />
            </button>
            
            {showImageMenu && (
              <ImageMenu
                onUpload={(e) => {
                  imageHandlers.handleImageChange(e)
                  setShowImageMenu(false)
                }}
                onOpenCamera={() => {
                  imageHandlers.openCamera()
                  setShowImageMenu(false)
                }}
                onRemove={() => {
                  imageHandlers.handleRemoveImage()
                  setShowImageMenu(false)
                }}
                hasImage={!!profilePreview}
                onClose={() => setShowImageMenu(false)}
              />
            )}
          </div>
        </div>
      </div>
      
      {/* User Info */}
      <div className="px-4 mb-6 text-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {formData.title} {formData.firstname} {formData.lastname}
        </h2>
        <p className="text-sm text-gray-600 mt-1">{formData.email}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-4 space-y-4" noValidate>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-200">
          <div className="p-4">
            <FormSelect
              label="คำนำหน้าชื่อ"
              id="title-mobile"
              name="title"
              value={formData.title}
              onChange={handleChange}
              options={titleOptions}
              required
              error={formErrors.title}
            />
          </div>

          <div className="p-4">
            <FormInput
              label="ชื่อจริง"
              id="firstname-mobile"
              name="firstname"
              value={formData.firstname}
              onChange={handleChange}
              autoComplete="given-name"
              required
              error={formErrors.firstname}
            />
          </div>

          <div className="p-4">
            <FormInput
              label="นามสกุล"
              id="lastname-mobile"
              name="lastname"
              value={formData.lastname}
              onChange={handleChange}
              autoComplete="family-name"
              required
              error={formErrors.lastname}
            />
          </div>

          <div className="p-4">
            <FormInput
              label="อีเมล์"
              id="email-mobile"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
              error={formErrors.email}
            />
          </div>

          <div className="p-4">
            <FormInput
              label="รหัสผ่าน (ถ้าไม่เปลี่ยนให้เว้นว่าง)"
              id="password-mobile"
              name="password"
              type="password"
              value={formData.password || ''}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="new-password"
              error={formErrors.password}
            />
          </div>

          <div className="p-4">
            <FormSelect
              label="ระดับผู้ใช้"
              id="role_id-mobile"
              name="role_id"
              value={formData.role_id}
              onChange={handleChange}
              options={roleOptions}
              required
              error={formErrors.role_id}
            />
          </div>

          <div className="p-4">
            <FormInput
              label="แผนก"
              id="department-mobile"
              name="department"
              value={formData.department || ''}
              onChange={handleChange}
              autoComplete="organization"
              error={formErrors.department}
            />
          </div>

          <div className="p-4">
            <FormSelect
              label="สถานะ"
              id="is_active-mobile"
              name="is_active"
              value={formData.is_active ? 'true' : 'false'}
              onChange={e => handleChange({ target: { name: 'is_active', value: e.target.value === 'true' } })}
              options={statusOptions}
              required
              error={formErrors.is_active}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pb-8">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            บันทึก
          </button>
        </div>
      </form>

      {/* Full Screen Modal */}
      {fullScreen && (
        <div 
          className="fixed inset-0 bg-black opacity-90 backdrop-blur-xs flex items-center justify-center z-50"
          onClick={() => setFullScreen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="แสดงรูปโปรไฟล์แบบเต็มหน้าจอ"
        >
          <button 
            onClick={() => setFullScreen(false)}
            className="absolute top-4 right-4 text-white text-4xl w-12 h-12 flex items-center justify-center hover:bg-white hover:bg-opacity-10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="ปิด"
          >
            ×
          </button>
          <div className="w-4/5 h-4/5 flex items-center justify-center p-4">
            <ProfileImage
              src={profilePreview}
              initial={getInitial(formData.firstname)}
              size="lg"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== Main Components ====================
const EditUserProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  // State Management
  const [formData, setFormData] = useState({
    title: '',
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    department: '',
    role_id: '',
    is_active: true,
    profile_image_url: '',
  })
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  const [profileImage, setProfileImage] = useState(null)
  const [profilePreview, setProfilePreview] = useState(null)
  const [removeProfileImage, setRemoveProfileImage] = useState(false)
  const [initialProfilePreview, setInitialProfilePreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showCamera, setShowCamera] = useState(false)

  // Fetch user data and roles
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Parallel fetching for better performance
        const [userData, rolesData] = await Promise.all([
          fetchJson(`${BASE_URL}/users/${id}`),
          fetchJson(`${BASE_URL}/roles`)
        ])

        setFormData({
          title: userData.title || '',
          firstname: userData.firstname || '',
          lastname: userData.lastname || '',
          email: userData.email || '',
          password: '',
          department: userData.department || '',
          role_id: userData.role?.id || '',
          is_active: userData.is_active,
          profile_image_url: userData.profile_image_url || '',
        })

        if (userData.profile_image_url) {
          setProfilePreview(userData.profile_image_url)
          setInitialProfilePreview(userData.profile_image_url)
        }

        setRoles(rolesData)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  // Form validation
  const validateForm = useCallback(() => {
    const errors = {}
    
    if (!formData.title) errors.title = 'กรุณาเลือกคำนำหน้าชื่อ'
    if (!formData.firstname) errors.firstname = 'กรุณากรอกชื่อจริง'
    if (!formData.lastname) errors.lastname = 'กรุณากรอกนามสกุล'
    if (!formData.email) {
      errors.email = 'กรุณากรอกอีเมล์'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'รูปแบบอีเมล์ไม่ถูกต้อง'
    }
    if (!formData.role_id) errors.role_id = 'กรุณาเลือกประเภทผู้ใช้'
    
    if (formData.password && formData.password.length < 6) {
      errors.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [formData])

  // Handle form input changes
  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }, [formErrors])
  
  // Handle image changes
  const handleImageChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error)
      return
    }

    setProfileImage(file)
    setRemoveProfileImage(false)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = () => {
      setProfilePreview(reader.result)
    }
    reader.onerror = () => {
      setError('ไม่สามารถอ่านไฟล์ได้')
    }
    reader.readAsDataURL(file)
  }, [])

  const handleRemoveImage = useCallback(() => {
    // mark for removal locally; actual deletion happens on Save (PUT request)
    setProfileImage(null)
    setProfilePreview(null)
    setRemoveProfileImage(true)
  }, [])

  // helper: convert dataURL -> File (used by ProfileCamera capture)
  const dataURLtoFile = useCallback((dataurl, filename) => {
    const arr = dataurl.split(',')
    const mime = arr[0].match(/:(.*?);/)[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new File([u8arr], filename, { type: mime })
  }, [])

  const handleCameraCapture = useCallback((imageData) => {
    const file = dataURLtoFile(imageData, 'profile.jpg')
    setProfileImage(file)
    setProfilePreview(imageData)
    setRemoveProfileImage(false)
    setShowCamera(false)
  }, [dataURLtoFile])

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    
    // Clear previous messages
    setError(null)
    setSuccess(null)
    
    // Validate form
    if (!validateForm()) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    try {
      setSubmitting(true)
      // Create FormData for file upload
      const formDataObj = new FormData()
      
      formDataObj.append('title', formData.title)
      formDataObj.append('firstname', formData.firstname)
      formDataObj.append('lastname', formData.lastname)
      formDataObj.append('email', formData.email)
      
      if (formData.password) {
        formDataObj.append('password', formData.password)
      }
      
      formDataObj.append('department', formData.department || '')
      formDataObj.append('role_id', Number(formData.role_id))
      formDataObj.append('is_active', formData.is_active === 'true' || formData.is_active === true)
      
      // Handle profile image
      if (profileImage) {
        formDataObj.append('profile_image', profileImage)
      } else if (removeProfileImage) {
        formDataObj.append('remove_profile_image', 'true')
      }
      
      // Submit form
      // Use fetchJson to handle errors consistently
      const data = await fetchJson(`${BASE_URL}/users/${id}`, {
        method: 'PUT',
        body: formDataObj,
      })
      
      setSuccess('บันทึกข้อมูลสำเร็จ')
      
      // Navigate back after delay
      setTimeout(() => {
        navigate(-1)
      }, 1000)
      
    } catch (err) {
      console.error('Submit error:', err)
      setError(err.message)
      // If delete failed or upload failed, revert preview
      if (!profileImage && initialProfilePreview && (removeProfileImage || !profileImage)) {
        setProfilePreview(initialProfilePreview)
        setRemoveProfileImage(false)
      }
    } finally {
      setSubmitting(false)
    }
  }, [formData, profileImage, removeProfileImage, id, navigate, validateForm, initialProfilePreview])

  const handleCancel = useCallback(() => {
    navigate(-1)
  }, [navigate])

  // Image handlers object for passing to layouts
  const imageHandlers = {
    handleImageChange,
    handleRemoveImage
    , openCamera: () => setShowCamera(true)
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto h-full w-full">
      <div className="h-full w-full bg-gray-50 flex flex-col">
        {/* Desktop Layout */}
        <div className="hidden md:flex h-full flex-col">
          <DesktopLayout
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            handleCancel={handleCancel}
            roles={roles}
            imageHandlers={imageHandlers}
            profilePreview={profilePreview}
            formErrors={formErrors}
            submitting={submitting}
          />
        </div>
        
        {/* Mobile Layout */}
        <div className="md:hidden h-full">
          <MobileLayout
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            handleCancel={handleCancel}
            roles={roles}
            imageHandlers={imageHandlers}
            profilePreview={profilePreview}
            formErrors={formErrors}
            submitting={submitting}
          />
        </div>
        
        {/* Toast Notifications */}
        {(error || success) && (
          <div 
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in"
            role="alert"
            aria-live="polite"
          >
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-md">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-md">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{success}</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {showCamera && (
        <ProfileCamera
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Additional CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translate(-50%, 1rem);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default EditUserProfile