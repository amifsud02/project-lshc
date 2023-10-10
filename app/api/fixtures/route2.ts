export async function GET(request: NextRequest) {
    
    const allFixtures = request.nextUrl.searchParams.get("allfixtures");
    const season = request.nextUrl.searchParams.get("season");
    const limit = request.nextUrl.searchParams.get("limit");
    const limitQuery = limit ? `[0..${limit}-1]` : "";
  
    type GroupType = "men" | "women" | "u21-men" | "u21-women";
  
    function fetchCategoryValues(group: string): string[] {
      const groupData = competitionDropdown[group];
      if (!groupData) {
        throw new Error(`Group '${group}' not found.`);
      }
  
      const values: string[] = [];
      for (const key in groupData) {
        if (groupData.hasOwnProperty(key)) {
          values.push(groupData[key].value);
        }
      }
  
      return values;
    }
  
    // Validate query parameters
    if (!season) {
      return NextResponse.json({
        message: "Missing 'season' parameter.",
        statusCode: 400
      });
    }
  
    if (allFixtures !== null) {
      const validGroups: GroupType[] = ["men", "women", "u21-men", "u21-women"];
      if (!validGroups.includes(allFixtures as GroupType)) {
        return NextResponse.json({
          message: "Invalid 'allfixtures' parameter value.",
          statusCode: 400,
        });
      }
  
      const competitionTypeNames = fetchCategoryValues(allFixtures)
  
      const query = groq`
        *[_type == "fixture" && competition->season == $season && competition->competitionType->competitionTypeName in $competitionTypeNames]{
            competition -> {
                competitionType -> {
                    competitionTypeName
                },
                season
            },
            homeTeamId -> { 
              teamName, 
              teamLogo
            },
            homeScore,
            awayTeamId -> { 
              teamName, 
              teamLogo
            },
            awayScore,
            status,
            startDate,
            venue
            
        } | order(startDate desc)${limitQuery}`;
      const fixtures = await client.fetch(query, { season, competitionTypeNames });
  
      return NextResponse.json({
        fixtures,
        competitionTypeNames: competitionTypeNames
      });
    } else {
      
      const competitionTypeName = request.nextUrl.searchParams.get("competitiontypename");
  
      if (!competitionTypeName) {
        return NextResponse.json({
          message: "Missing 'competitiontypename' parameter.",
          statusCode: 400,
        });
      }
  
      const query = groq`
        *[_type == "fixture" && competition->season == $season && competition->competitionType->competitionTypeName == $competitionTypeName]{
            competition -> {
                competitionType -> {
                    competitionTypeName
                },
                season
            },
            homeTeamId -> { 
              teamName, 
              teamLogo
            },
            homeScore,
            awayTeamId -> { 
              teamName, 
              teamLogo
            },
            awayScore,
            status,
            startDate,
            venue
            
        } | order(startDate desc)${limitQuery}`;
  
      const fixtures = await client.fetch(query, { season, competitionTypeName });
  
      return NextResponse.json({
        fixtures,
      });
    }
  }