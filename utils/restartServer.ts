import { exec } from "child_process";


const clearlogs = () => {

    
exec("pm2 restart all", (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error restarting PM2: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`⚠️ PM2 Restart Stderr: ${stderr}`);
      return;
    }
    console.log(`✅ PM2 Restart Success: ${stdout}`);
  });

}

export { clearlogs };