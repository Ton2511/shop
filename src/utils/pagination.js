// src/utils/pagination.js
/**
 * คำนวณเพจิเนชันสำหรับการแสดงผลข้อมูลที่แบ่งหน้า
 * @param {number} totalItems - จำนวนรายการทั้งหมด
 * @param {number} currentPage - หน้าปัจจุบัน
 * @param {number} perPage - จำนวนรายการต่อหน้า
 * @param {number} pageRange - จำนวนปุ่มตัวเลขที่แสดง
 * @returns {Object} ข้อมูลเพจิเนชัน
 */
exports.getPagination = (totalItems, currentPage = 1, perPage = 10, pageRange = 5) => {
    // แปลงค่าเป็นตัวเลข
    currentPage = parseInt(currentPage);
    totalItems = parseInt(totalItems);
    perPage = parseInt(perPage);
    
    // คำนวณจำนวนหน้าทั้งหมด
    const totalPages = Math.ceil(totalItems / perPage);
    
    // ป้องกันกรณีหน้าปัจจุบันไม่ถูกต้อง
    if (currentPage < 1) {
      currentPage = 1;
    } else if (currentPage > totalPages) {
      currentPage = totalPages || 1;
    }
    
    // คำนวณดัชนีเริ่มต้นและสิ้นสุดสำหรับ SQL LIMIT และ OFFSET
    const offset = (currentPage - 1) * perPage;
    
    // คำนวณช่วงปุ่มเพจเนชัน
    let startPage = Math.max(1, currentPage - Math.floor(pageRange / 2));
    let endPage = startPage + pageRange - 1;
    
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - pageRange + 1);
    }
    
    // สร้างอาร์เรย์หน้า
    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return {
      totalItems,
      currentPage,
      perPage,
      totalPages,
      startPage,
      endPage,
      pages,
      offset,
      hasPrevPage: currentPage > 1,
      hasNextPage: currentPage < totalPages,
      prevPage: currentPage - 1,
      nextPage: currentPage + 1
    };
  };