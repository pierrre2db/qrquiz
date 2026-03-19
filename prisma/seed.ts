import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Seed questions / stations
  await prisma.question.createMany({
    data: [
      {
        stationLabel: 'Salle Informatique',
        stationCode: '101',
        order: 1,
        isActive: true,
        question: 'Quel protocole sécurise les communications HTTP ?',
        optionA: 'FTP',
        optionB: 'TLS',
        optionC: 'SSH',
        optionD: 'SMTP',
        correctAnswer: 1,
        explanation: 'TLS (Transport Layer Security) est le protocole qui sécurise HTTP pour former HTTPS.',
      },
      {
        stationLabel: 'Labo de Sciences',
        stationCode: '102',
        order: 2,
        isActive: true,
        question: 'Quelle est la formule chimique de l\'eau ?',
        optionA: 'CO2',
        optionB: 'NaCl',
        optionC: 'H2O',
        optionD: 'O2',
        correctAnswer: 2,
        explanation: 'L\'eau est composée de 2 atomes d\'hydrogène et 1 atome d\'oxygène : H2O.',
      },
      {
        stationLabel: 'Bibliothèque',
        stationCode: '103',
        order: 3,
        isActive: true,
        question: 'Combien de livres contient une bibliothèque universitaire en moyenne ?',
        optionA: 'Entre 50 000 et 100 000',
        optionB: 'Entre 500 et 1 000',
        optionC: 'Entre 1 000 et 5 000',
        optionD: 'Plus d\'un million',
        correctAnswer: 0,
        explanation: 'Une bibliothèque universitaire contient généralement entre 50 000 et 100 000 ouvrages.',
      },
    ],
    skipDuplicates: true,
  })

  // Seed settings
  await prisma.setting.upsert({
    where: { key: 'active_questions_count' },
    update: {},
    create: { key: 'active_questions_count', value: '3' },
  })

  await prisma.setting.upsert({
    where: { key: 'max_questions_limit' },
    update: {},
    create: { key: 'max_questions_limit', value: '20' },
  })

  await prisma.setting.upsert({
    where: { key: 'subsidiary_question' },
    update: {},
    create: {
      key: 'subsidiary_question',
      value: 'En quelle année a été fondé cet établissement ?',
    },
  })

  console.log('✅ Seed terminé : 3 stations + settings insérés')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
