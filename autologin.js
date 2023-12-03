const Nightmare = require("nightmare");
const fs = require("fs");
require("dotenv").config();
// ฟังก์ชันในการล็อกอิน
const login = async (nightmare, username, password) => {
  console.log(`[${username}] กำลังเข้าสู่ระบบ...`);

  await nightmare
    .goto(`${process.env.BASE_URL}/main`)
    .wait("#exeid")
    .type("#exeid", username)
    .type("#password", password)
    .click('button[type="submit"]')
    .wait(5000) // รอเพื่อให้หน้าเว็บโหลด
    .wait(() => !document.querySelector("body.loader-bg")); // รอให้ loader-bg หายไป
  console.log(`[${username}] เข้าสู่ระบบเรียบร้อย`);
};

// ฟังก์ชันในการทำกิจกรรม
const doActivity = async (nightmare, username) => {
  let loggedIn = true;

  while (loggedIn) {
    // รอหน้าเว็บโหลด
    await nightmare.wait(".marin-event");

    // เช็คว่าสามารถทำกิจกรรมได้หรือไม่
    const canDoActivity = await nightmare.evaluate(() => {
      const readyButton = document.querySelector(".btn.daily-btn.d-flex.flex-column.items-ready");
      return readyButton && !readyButton.hasAttribute("disabled");
    });

    if (canDoActivity) {
      // ตรวจสอบว่าปุ่ม items-ready ถูก disable หรือไม่ปรากฎ
      const itemsReadyButton = await nightmare.evaluate(() => {
        const readyButton = document.querySelector(".btn.daily-btn.d-flex.flex-column.items-ready");
        return readyButton && !readyButton.hasAttribute("disabled");
      });

      if (itemsReadyButton) {
        // กดปุ่มร่วมกิจกรรม
        await nightmare.click(".btn.daily-btn.d-flex.flex-column.items-ready").wait(5000); // รอเพื่อให้หน้าเว็บโหลด
        console.log(`[${username}]  รับรางวัล`);
        // รอสำเร็จ
        const successButtonSelector = ".swal2-confirm.oz-confirm-btn.swal2-styled";
        await nightmare
          .wait(successButtonSelector)
          .click(successButtonSelector)
          .wait(5000) // รอเพื่อให้หน้าเว็บโหลด
          .wait(() => !document.querySelector("body.loader-bg"));
        console.log(`[${username}] รับรางวัลเรียบร้อย`);
        // ปิด swal2
        await nightmare.evaluate(() => {
          Swal.close();
        });
      } else {
        console.log(`[${username}] ไม่สามารถทำกิจกรรมได้`);
      }

      // ตรวจสอบว่ายังคงอยู่ในสถานะ login
      loggedIn = await nightmare.exists(".btn.logout-btn");
    } else {
      console.log(`[${username}] รับของกิจกรรมไปแล้ว`);
      loggedIn = false;
    }
  }
};

// ฟังก์ชันในการล็อกเอาท์
const logout = async (nightmare, username) => {
  console.log(`[${username}] ทำการออกจากระบบ`);

  await nightmare.wait(".btn.logout-btn").click(".btn.logout-btn").wait(5000); // รอเพื่อให้หน้าเว็บโหลด

  console.log(`[${username}] ออกจากระบบเรียบร้อย`);
};

// ฟังก์ชันหลัก
const main = async () => {
  const path = "accounts.txt";

  if (fs.existsSync(path)) {
    const accounts = fs.readFileSync(path, "utf-8").split("\n").filter(Boolean);

    for (const account of accounts) {
      const [username, password] = account.split(",");
      console.log(`[${accounts.indexOf(account) + 1}] กำลังดำเนินการในบัญชี ${username}`);

      const nightmare = Nightmare({ show: true }); // แสดงหน้าต่าง GUI ของ Nightmare

      await login(nightmare, username, password);
      await doActivity(nightmare,username);
      await logout(nightmare, username);

      await nightmare.end(); // ปิด Nightmare
    }
  } else {
    console.error("ไม่พบไฟล์");
  }
};

// เริ่มทำงาน
main();

// ฟังก์ชันสำหรับสร้าง URL
// const getURL = path => `https://activities2.exe.in.th/dl/granado-espada/ge-daily-login-dec-2023${path}`;
