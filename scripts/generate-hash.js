const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'password';
  const hash = await bcrypt.hash(password, 10);
  
  console.log('='.repeat(60));
  console.log('비밀번호:', password);
  console.log('해시값:', hash);
  console.log('='.repeat(60));
  console.log('\nSupabase SQL Editor에서 다음 SQL을 실행하세요:');
  console.log('\nUPDATE users');
  console.log(`SET password = '${hash}'`);
  console.log("WHERE username = 'nano';");
  console.log('\n또는 INSERT 문:');
  console.log('\nINSERT INTO users (username, password)');
  console.log(`VALUES ('nano', '${hash}')`);
  console.log("ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password;");
}

generateHash().catch(console.error);
