import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
const prisma=new PrismaClient();
async function main() {
  await prisma.user.upsert({where:{email:'demo@shopai.com'},update:{},create:{email:'demo@shopai.com',password:await bcrypt.hash('123456',12),name:'Học viên Demo'}});
  console.log('Demo user ready: demo@shopai.com (password documented in README).');
}
main().catch(()=>{console.error('Seed failed');process.exitCode=1;}).finally(()=>prisma.$disconnect());
