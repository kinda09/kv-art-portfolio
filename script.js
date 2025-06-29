// === CONFIGURATION ===
const API_BASE = 'http://localhost:3000'; // Change to your deployed URL when online

// Gallery data storage
let galleryData = JSON.parse(localStorage.getItem('galleryData')) || [];

// DOM elements
const galleryGrid = document.getElementById('galleryGrid');
const imageUpload = document.getElementById('imageUpload');
const imageTitle = document.getElementById('imageTitle');
const imageDescription = document.getElementById('imageDescription');
const uploadBtn = document.getElementById('uploadBtn');
const uploadStatus = document.getElementById('uploadStatus');
const modal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const modalCaption = document.getElementById('modalCaption');
const closeBtn = document.querySelector('.close');
const uploadSection = document.getElementById('upload');
const hamburgerMenu = document.querySelector('.hamburger-menu');
const navLinks = document.querySelector('.nav-links');

// === PASSWORD PROTECTION ===
let isUploader = false;
function showUploadPrompt() {
    const password = prompt('Enter upload password:');
    if (password) {
        // Try a dummy upload to check password
        fetch(`${API_BASE}/api/gallery`).then(() => {
            isUploader = true;
            uploadSection.style.display = 'block';
        });
        // Store password in memory for upload
        window.__UPLOAD_PASSWORD = password;
    }
}

// === GALLERY (STATIC) ===
const staticImages = [
    { src: 'حمود (1).jpg', title: 'رسم بورتريه بالألوان الخشبية' },
    { src: 'حمود (2).jpg', title: ' رسم بورتريه بالألوان الخشبية' },
    { src: 'كيوجيرو و اكازا.jpg', title: 'رسمة كيوجيرو و أكازا من أنمي Demon Slayer ' },
    { src: 'سينكو.jpg', title: 'رسم شخصية سينكو من أنمي Dr.Stone' },
    { src: 'رسم على ايباد.jpg', title: 'رسم على اللآيباد' },
    { src: 'ناروتو.jpg', title: 'رسم ناروتو على الزجاج' },
    { src: 'بسة فانجوخ.jpg', title: 'لوحة قطة بأسلوب فانجوخ بألوان Oil Pastel' },
    { src: 'رسمة جمجمة.jpg', title: ' لوحة جمجمة بألوان Oil Pastel' },
    { src: 'ميناتو زجاج.jpg', title: 'رسم شخصية ميناتو على الزجاج' },
    { src: 'ساندي.jpg', title: 'رسم بورتريه بالألوان الخشبية' }
];

function displayStaticGallery(images) {
    galleryGrid.innerHTML = '';
    if (!images || images.length === 0) {
        galleryGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #666;">
                <i class="fas fa-images" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <h3>No artwork uploaded yet</h3>
            </div>
        `;
        return;
    }
    images.forEach((item) => {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        galleryItem.innerHTML = `
            <div class="gallery-item-image">
                <img src="${item.src}" alt="${item.title}" loading="lazy">
            </div>
            <div class="gallery-item-info">
                <h3>${item.title}</h3>
            </div>
        `;
        // Make image clickable to open modal
        const img = galleryItem.querySelector('img');
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', () => {
            openModal({ src: item.src, title: item.title });
        });
        galleryGrid.appendChild(galleryItem);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    displayStaticGallery(staticImages);
});

// === UPLOAD ===
async function handleImageUpload() {
    const files = imageUpload.files;
    const title = imageTitle.value.trim();
    const description = imageDescription.value.trim();
    const password = window.__UPLOAD_PASSWORD || '';
    if (files.length === 0) {
        showUploadStatus('Please select at least one image.', 'error');
        return;
    }
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    let uploadedCount = 0;
    const totalFiles = files.length;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('image', file);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('password', password);
        try {
            const res = await fetch(`${API_BASE}/api/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');
            uploadedCount++;
        } catch (err) {
            showUploadStatus(err.message, 'error');
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Artwork';
            return;
        }
    }
    showUploadStatus(`Successfully uploaded ${uploadedCount} image(s)!`, 'success');
    uploadBtn.disabled = false;
    uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Artwork';
    resetUploadForm();
    // Refresh gallery
    const images = await fetchGallery();
    displayGallery(images);
}

// === INIT ===
document.addEventListener('DOMContentLoaded', async () => {
    const images = await fetchGallery();
    displayGallery(images);
});

// Delete image function
function deleteImage(imageId) {
    if (confirm('Are you sure you want to delete this artwork? This action cannot be undone.')) {
        galleryData = galleryData.filter(item => item.id !== imageId);
        saveGalleryData();
        displayGallery();
        
        // Show success message
        const statusDiv = document.createElement('div');
        statusDiv.className = 'upload-status success';
        statusDiv.innerHTML = 'Artwork deleted successfully!';
        statusDiv.style.position = 'fixed';
        statusDiv.style.top = '20px';
        statusDiv.style.right = '20px';
        statusDiv.style.zIndex = '3000';
        statusDiv.style.padding = '10px 20px';
        statusDiv.style.borderRadius = '5px';
        statusDiv.style.backgroundColor = '#28a745';
        statusDiv.style.color = 'white';
        statusDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        
        document.body.appendChild(statusDiv);
        
        // Remove the message after 3 seconds
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.parentNode.removeChild(statusDiv);
            }
        }, 3000);
    }
}

// Save gallery data to localStorage
function saveGalleryData() {
    localStorage.setItem('galleryData', JSON.stringify(galleryData));
}

// Reset upload form
function resetUploadForm() {
    imageUpload.value = '';
    imageTitle.value = '';
    imageDescription.value = '';
    uploadBtn.disabled = false;
    uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Artwork';
}

// Show upload status
function showUploadStatus(message, type) {
    uploadStatus.innerHTML = message;
    uploadStatus.className = `upload-status ${type}`;
}

// Open image modal
function openModal(item) {
    modal.style.display = 'block';
    modalImage.src = item.src;
    modalCaption.textContent = item.title;
    modalImage.style.transform = 'scale(1)';
    modalImage.setAttribute('data-zoom', '1');
}

// Close modal
function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Event listeners
if (uploadBtn) uploadBtn.addEventListener('click', handleImageUpload);
if (closeBtn) closeBtn.addEventListener('click', closeModal);
if (modal) modal.addEventListener('click', function(e) {
    if (e.target === modal) {
        closeModal();
    }
});
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal && modal.style.display === 'block') {
        closeModal();
    }
});
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Copy email function
function copyEmail() {
    const email = 'majidasabri82@gmail.com';
    navigator.clipboard.writeText(email).then(function() {
        // Show success message
        const emailText = document.querySelector('.email-text');
        const originalText = emailText.textContent;
        emailText.textContent = 'Email copied!';
        emailText.style.color = '#27ae60';
        
        setTimeout(() => {
            emailText.textContent = originalText;
            emailText.style.color = '#e74c3c';
        }, 2000);
    }).catch(function(err) {
        console.error('Could not copy email: ', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = email;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        const emailText = document.querySelector('.email-text');
        const originalText = emailText.textContent;
        emailText.textContent = 'Email copied!';
        emailText.style.color = '#27ae60';
        
        setTimeout(() => {
            emailText.textContent = originalText;
            emailText.style.color = '#e74c3c';
        }, 2000);
    });
}

// Add some sample images for demonstration (you can remove this)
function addSampleImages() {
    if (galleryData.length === 0) {
        // Add some placeholder images for demonstration
        const sampleImages = [
            {
                id: 1,
                src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlNhbXBsZSBJbWFnZSAxPC90ZXh0Pgo8L3N2Zz4=',
                title: 'Sample Artwork 1',
                description: 'This is a sample artwork to demonstrate the gallery.',
                uploadDate: new Date().toISOString()
            },
            {
                id: 2,
                src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTBmMGYwIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlNhbXBsZSBJbWFnZSAyPC90ZXh0Pgo8L3N2Zz4=',
                title: 'Sample Artwork 2',
                description: 'Another sample artwork to show the gallery layout.',
                uploadDate: new Date().toISOString()
            }
        ];
        
        galleryData = sampleImages;
        saveGalleryData();
        displayGallery();
    }
}

// Uncomment the line below to add sample images for demonstration
// addSampleImages();

// === HAMBURGER MENU ===
if (hamburgerMenu && navLinks) {
    hamburgerMenu.addEventListener('click', () => {
        navLinks.classList.toggle('nav-active');

        // Optional: Change hamburger icon to an "X" when open
        const icon = hamburgerMenu.querySelector('i');
        if (navLinks.classList.contains('nav-active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });

    // Close menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks.classList.contains('nav-active')) {
                navLinks.classList.remove('nav-active');
                const icon = hamburgerMenu.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    });
}

// Zoom in/out with mouse wheel
modalImage.addEventListener('wheel', function(e) {
    e.preventDefault();
    let zoom = parseFloat(modalImage.getAttribute('data-zoom')) || 1;
    if (e.deltaY < 0) {
        zoom = Math.min(zoom + 0.1, 3); // max 3x
    } else {
        zoom = Math.max(zoom - 0.1, 1); // min 1x
    }
    modalImage.style.transform = `scale(${zoom})`;
    modalImage.setAttribute('data-zoom', zoom);
});

// Close modal when clicking outside the image
modal.onclick = function(e) {
    if (e.target === modal) {
        modal.style.display = 'none';
        modalImage.src = '';
        modalCaption.textContent = '';
    }
}; 