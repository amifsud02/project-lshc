const newTeams = [
    {
        name: 'Hamrun',
        logo: 'https://i.postimg.cc/x1qd4st0/Hamrun.png',
        country: 'Malta'
    },
    {
        name: 'Kavallieri',
        logo: 'https://i.postimg.cc/65M3zsVj/Kavallieri.png',
        country: 'Malta'
    },
    {
        name: 'HMS',
        logo: 'https://thumbs2.imgbox.com/e0/5c/IZc6QwOm_t.png',
        country: 'Malta'
    },
    {
        name: 'Zebbug',
        logo: 'https://i.postimg.cc/zBYX3q5B/Zebbug.png',
        country: 'Malta'
    },
    {
        name: 'Aloysians',
        logo: 'https://thumbs2.imgbox.com/b0/a8/QcihpPaN_t.png',
        country: 'Malta'
    },
    {
        name: 'Phoenix',
        logo: 'https://i.postimg.cc/VNCkYdxp/Phoenix.png',
        country: 'Malta'
    },
    {
        name: 'Valletta',
        logo: 'https://i.postimg.cc/65M3zsVj/Kavallieri.png',
        country: 'Malta'
    },

]

async function main() {
    const team = newTeams.map((t) =>
        prisma.team.create({
            data: t
        })
    )
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.log(e)
        await prisma.$disconnect()
        process.exit(1)
    })