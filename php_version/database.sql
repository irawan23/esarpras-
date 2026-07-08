-- Skema Database SIMSARPRAS (MySQL)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    role ENUM('admin', 'operator', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    pic_name VARCHAR(100),
    description TEXT
);

CREATE TABLE inventory_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    barcode VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category ENUM('umum', 'tanah', 'bangunan') NOT NULL,
    brand VARCHAR(100),
    specification TEXT,
    year_acquired INT,
    source_fund VARCHAR(100),
    price DECIMAL(15, 2),
    condition_status ENUM('baik', 'rusak_ringan', 'rusak_berat') DEFAULT 'baik',
    status ENUM('aktif', 'non-aktif') DEFAULT 'aktif',
    room_id INT,
    pic_name VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- User Default: admin / admin123
INSERT INTO users (username, password, name, role) VALUES ('admin', 'admin123', 'Administrator Utama', 'admin');

-- Dummy Rooms
INSERT INTO rooms (code, name, pic_name) VALUES ('LAB-01', 'Laboratorium Komputer 1', 'Bpk. Ahmad');
INSERT INTO rooms (code, name, pic_name) VALUES ('R-GURU', 'Ruang Guru', 'Ibu Siti');

-- Dummy Inventory
INSERT INTO inventory_items (barcode, name, category, brand, year_acquired, room_id, condition_status) 
VALUES ('BRC-001', 'Laptop ASUS ExpertBook', 'umum', 'ASUS', 2023, 1, 'baik');
INSERT INTO inventory_items (barcode, name, category, brand, year_acquired, room_id, condition_status) 
VALUES ('BRC-002', 'Proyektor Epson EB-X400', 'umum', 'Epson', 2022, 1, 'baik');
INSERT INTO inventory_items (barcode, name, category, brand, year_acquired, room_id, condition_status) 
VALUES ('BRC-003', 'Kursi Kantor Ergonomis', 'umum', 'Informa', 2021, 2, 'rusak_ringan');
