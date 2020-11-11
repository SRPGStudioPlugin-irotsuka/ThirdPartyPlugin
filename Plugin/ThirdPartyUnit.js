/*--------------------------------------------------------------------------
【概要】
第三陣営を追加するプラグイン。

【導入方法】
第三陣営に設定したいユニットのカスタムパラメータに以下のパラメータを追加する。
{isThird : "true"}

他のプラグインとの競合はまだ対応できてない。

【例】
{isThird : "true"}

【パラメータ詳細】
現在は isThird のみ。

【更新履歴】
2020/11/07 : 初版

【対応バージョン】
SRPG Studio Version:1.213

--------------------------------------------------------------------------*/

(function() {
    // 第三陣営の文字列を追加
    StringTable.UnitType_Third = 'THIRD';

    // ユニットタイプに第三陣営を追加
    UnitType.THIRD = 3;

    // マップの遷移タイプ
    var StartEndType = {
        MAP_START: 0,
        PLAYER_START: 1,
        PLAYER_END: 2,
        ENEMY_START: 3,
        ENEMY_END: 4,
        ALLY_START: 5,
        ALLY_END: 6,
        THIRD_START: 7,
        THIRD_END: 8,
        NONE: 9
    };
    
    // 行動中の陣営
    var TurnType = {
        PLAYER: 0,
        ENEMY: 1,
        ALLY: 2,
        THIRD: 3
    };

    // ユニットのフィルターの種類
    var UnitFilterFlag = {
        PLAYER: 0x01,
        ENEMY: 0x02,
        ALLY: 0x04,
        THIRD: 0x08
    };

    var alias = UnitProvider.setupFirstUnit;

    UnitProvider.setupFirstUnit = function(unit) {
        alias.call(this, unit);

        // 陣営の設定(起動初期は何故か boolean 値が利用できないので String を利用)
        if (unit.custom.isThird === "true") {
            root.log(unit.getUnitType());

            setThirdPartyUnit(unit);

            root.log(unit.getUnitType());
        }
    }

    setThirdPartyUnit = function(unit){
        // 属性を直接 THIRD に書き換えるとうまく動かなそうなので，とりあえず isThird を見て
        var generator = root.getEventGenerator();
        //generator.unitAssign(unit, UnitType.THIRD);
        generator.execute();

        return true;
    }

    var alias2 = CombinationCollector.Weapon._getWeaponFilter;

    CombinationCollector.Weapon._getWeaponFilter =  function(unit) {
		return FilterControl.getUnitReverseFilter(unit);
    }
    
    var alias3 = TurnChangeStart.getStartEndType;

    TurnChangeStart.getStartEndType = function(){
		var startEndType = StartEndType.PLAYER_START;
		var turnType = root.getCurrentSession().getTurnType();
		
		if (turnType === TurnType.PLAYER) {
			startEndType = StartEndType.PLAYER_START;
		}
		else if (turnType === TurnType.ENEMY) {
			startEndType = StartEndType.ENEMY_START;
		}
		else if (turnType === TurnType.THIRD) {
			startEndType = StartEndType.ALLY_START;
		}
		else if (turnType === TurnType.ALLY) {
			startEndType = StartEndType.ALLY_START;
		}
		
		return startEndType;
	}

    var alias4 = TurnChangeEnd.getStartEndType;

    TurnChangeEnd.getStartEndType = function(){
		var startEndType = StartEndType.PLAYER_END;
		var turnType = root.getCurrentSession().getTurnType();
		
		if (turnType === TurnType.PLAYER) {
			startEndType = StartEndType.PLAYER_END;
		}
		else if (turnType === TurnType.ENEMY) {
			startEndType = StartEndType.ENEMY_END;
		}
		else if (turnType === TurnType.THIRD) {
			startEndType = StartEndType.THIRD_END;
		}
		else if (turnType === TurnType.ALLY) {
			startEndType = StartEndType.ALLY_END;
		}
		
        return startEndType;
    }
    
    var alias5 = TurnChangeEnd._startNextTurn;

    // 次のターンに移行する（第三陣営の動く順番を変える場合はここを弄る）
    TurnChangeEnd._startNextTurn = function() {
		var nextTurnType;
		var turnType = root.getCurrentSession().getTurnType();
		
		this._checkActorList();
		
		if (turnType === TurnType.PLAYER) {
			nextTurnType = TurnType.ENEMY;
		}
		else if (turnType === TurnType.ENEMY) {
			nextTurnType = TurnType.THIRD;
		}
		else if (turnType === TurnType.THIRD) {
			nextTurnType = TurnType.ALLY;
		}
		else {
			nextTurnType = TurnType.PLAYER;
		}
		
		root.getCurrentSession().setTurnType(nextTurnType);
    }
    
    var alias6 = TurnChangeMapStart.doLastAction;

    TurnChangeMapStart.doLastAction =  function() {
		var turnType = TurnType.PLAYER;
		
		if (PlayerList.getSortieList().getCount() > 0) {
			turnType = TurnType.PLAYER;
		}
		else if (EnemyList.getAliveList().getCount() > 0) {
			turnType = TurnType.ENEMY;
		}
		else if (ThirdList.getAliveList().getCount() > 0) {
			turnType = TurnType.THIRD;
		}
		else if (AllyList.getAliveList().getCount() > 0) {
			turnType = TurnType.ALLY;
		}
		
		root.getCurrentSession().setTurnCount(0);
		root.getCurrentSession().setTurnType(turnType);
	}

    var alias7 = BaseTurnLogoFlowEntry._isTurnGraphicsDisplayable;

    BaseTurnLogoFlowEntry._isTurnGraphicsDisplayable = function() {
		var count;
		var turnType = root.getCurrentSession().getTurnType();
		
		if (turnType === TurnType.PLAYER) {
			count = PlayerList.getSortieList().getCount();
		}
		else if (turnType === TurnType.ENEMY) {
			count = EnemyList.getAliveList().getCount();
		}
		else if (turnType === TurnType.THIRD) {
			count = ThirdList.getAliveList().getCount();
		}
		else {
			count = AllyList.getAliveList().getCount();
		}
		
		return count > 0;
	}

    var alias8 = TurnMarkFlowEntry._getTurnFrame;

    TurnMarkFlowEntry._getTurnFrame = function() {
		var pic;
		var turnType = root.getCurrentSession().getTurnType();
		
		if (turnType === TurnType.PLAYER) {
			pic = root.queryUI('playerturn_frame');
		}
		else if (turnType === TurnType.ENEMY) {
			pic = root.queryUI('enemyturn_frame');
		}
		else if (turnType === TurnType.THIRD) {
			pic = root.queryUI('enemyturn_frame');
		}
		else {
			pic = root.queryUI('partnerturn_frame');
		}
		
		return pic;
	}

    var alias8 = TurnAnimeFlowEntry._getTurnFrame;

    TurnAnimeFlowEntry._getTurnAnime = function() {
		var animeData;
		var turnType = root.getCurrentSession().getTurnType();
		
		if (turnType === TurnType.PLAYER) {
			animeData = root.queryAnime('playerturn_anime');
		}
		else if (turnType === TurnType.ENEMY) {
			animeData = root.queryAnime('enemyturn_anime');
		}
		else if (turnType === TurnType.THIRD) {
			animeData = root.queryAnime('enemyturn_anime');
		}
		else {
			animeData = root.queryAnime('partnerturn_anime');
		}
		
		return animeData;
    }
    
    var alias9 = FreeAreaScene.getTurnObject;

    FreeAreaScene.getTurnObject = function() {
		var obj = null;
		var type = root.getCurrentSession().getTurnType();
		
		if (type === TurnType.PLAYER) {
			obj = this._playerTurnObject;
		}
		else if (type === TurnType.ENEMY) {
			obj = this._enemyTurnObject;
		}
		else if (type === TurnType.THIRD) {
			obj = this._thirdTurnObject;
		}
		else if (type === TurnType.ALLY) {
			obj = this._partnerTurnObject;
		}
		
		return obj;
	}

    var alias10 = FreeAreaScene._prepareSceneMemberData;

    FreeAreaScene._prepareSceneMemberData = function() {
		this._turnChangeStart = createObject(TurnChangeStart);
		this._turnChangeEnd = createObject(TurnChangeEnd);
		this._playerTurnObject = createObject(PlayerTurn);
		this._enemyTurnObject = createObject(EnemyTurn);
		this._thirdTurnObject = createObject(EnemyTurn);
		this._partnerTurnObject = createObject(EnemyTurn);
    }
    
    var alias11 = LoadSaveScreenEx._setPositionSettings;

    // セーブした位置情報の取得
    LoadSaveScreenEx._setPositionSettings = function(obj) {
		var area, mapInfo;
		
		obj.playerArrayX = [];
		obj.playerArrayY = [];
		obj.enemyArrayX = [];
		obj.enemyArrayY = [];
		obj.thirdArrayX = [];
		obj.thirdArrayY = [];
		obj.allyArrayX = [];
		obj.allyArrayY = [];
		
		if (this._screenParam.scene === SceneType.REST) {
			area = root.getRestPreference().getActiveRestAreaFromMapId(this._screenParam.mapId);
			obj.areaId = area.getId();
			return obj;
		}
		else {
			mapInfo = root.getCurrentSession().getCurrentMapInfo();
			if (this._screenParam.mapId !== mapInfo.getId()) {
				return obj;
			}
		}
		
		this._setPositionSettingsInternal(PlayerList.getSortieList(), obj.playerArrayX, obj.playerArrayY);
		this._setPositionSettingsInternal(EnemyList.getAliveList(), obj.enemyArrayX, obj.enemyArrayY);
		this._setPositionSettingsInternal(ThirdList.getAliveList(), obj.thirdArrayX, obj.thirdArrayY);
		this._setPositionSettingsInternal(AllyList.getAliveList(), obj.allyArrayX, obj.allyArrayY);
	}

    var alias12 = ObjectiveFaceZone._getTotalValue;

    // ユニット総数を取得
    ObjectiveFaceZone._getTotalValue = function(unitType) {
		var list;
		
		if (unitType === UnitType.PLAYER) {
			list = PlayerList.getSortieDefaultList();
		}
		else if (unitType === UnitType.ENEMY) {
			list = EnemyList.getAliveDefaultList();
		}
		else if (unitType === UnitType.THIRD) {
			list = ThirdList.getAliveDefaultList();
		}
		else {
			list = AllyList.getAliveDefaultList();
		}
		
		return list.getCount();
	}

    var alias13 = ObjectiveFaceZone._getLeaderUnit;

    // リーダーユニットを見つける
	ObjectiveFaceZone._getLeaderUnit = function(unitType) {
		var i, list, count;
		var unit = null;
		var firstUnit = null;
		
		if (unitType === UnitType.PLAYER) {
			list = PlayerList.getMainList();
		}
		else if (unitType === UnitType.ENEMY) {
			list = EnemyList.getMainList();
		}
		else if (unitType === UnitType.THIRD) {
			list = ThirdList.getMainList();
		}
		else {
			list = AllyList.getMainList();
		}
		
		count = list.getCount();
		if (count === 0) {
			return null;
		}
		
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			if (unit.getSortieState() === SortieType.UNSORTIE) {
				continue;
			}
			
			if (unit.getAliveState() === AliveType.ERASE) {
				continue;
			}
			
			if (firstUnit === null) {
				firstUnit = unit;
			}
			
			if (unit.getImportance() === ImportanceType.LEADER) {
				break;
			}
		}
		
		// リーダーが見つからないため、一番最初に見つかったユニットを対象にする
		if (i === count) {
			unit = firstUnit;
		}
		
		return unit;
    }
    
    var allias14 = UnitMenuScreen._getUnitList;

    UnitMenuScreen._getUnitList = function(unit) {
		var list = [];
		var type = unit.getUnitType();
        
        if (unit.custom.isThird === "true") {
			type = UnitType.THIRD;
            setThirdPartyUnit(unit);
		}

        if (type === UnitType.PLAYER) {
			if (this._unitEnumMode === UnitMenuEnum.ALIVE) {
				if (unit.isGuest()) {
					// 開かれているユニットがゲストの場合は、ゲストユニットに切り替えるようにする
					list = root.getCurrentSession().getGuestList();
				}
				else {
					list = PlayerList.getAliveDefaultList();
				}
			}
			else if (this._unitEnumMode === UnitMenuEnum.SORTIE) {
				// 出撃が完了している場合は、PlayerListにゲストユニットも含まれる
				list = PlayerList.getSortieDefaultList();
			}
			else if (this._unitEnumMode === UnitMenuEnum.SINGLE) {
				list = StructureBuilder.buildDataList();
				list.setDataArray([unit]);
			}
		}
		else if (type === UnitType.ENEMY) {
			list = EnemyList.getAliveDefaultList();
		}
		else if (type === UnitType.THIRD) {
			list = ThirdList.getAliveDefaultList();
		}
		else if (type === UnitType.ALLY) {
			list = AllyList.getAliveDefaultList();
		}
		
		return list;
    }
    
    var alias15 = EnemyList.getMainList;
    
    EnemyList.getMainList = function() {
		var i, obj;
		var list = root.getCurrentSession().getEnemyList()
		var count = list.getCount();
		var unit_list = [];

		for (i = 0; i < count; i++) {
			var unit = list.getData(i);

			// isThird が未定義 / false の場合は通常と同じ扱い
			if (!(unit.custom.isThird === "true")) {
				unit_list.push(unit);
                setThirdPartyUnit(unit);
			}
		}

		obj = StructureBuilder.buildDataList();
		obj.setDataArray(unit_list);

		return obj;
	}

    /*
    * 第三陣営のリスト
    * getUnitType は Enemy のままなので注意
    * setupCustomCharChip を使用すれば、色が変えられそう？
    */
    var ThirdList ={
        getAliveList: function() {
            return AllUnitList.getAliveList(this.getMainList());
        },
        
        getAliveDefaultList: function() {
            return AllUnitList.getAliveDefaultList(this.getMainList());
        },
        
        getDeathList: function() {
            return AllUnitList.getDeathList(this.getMainList());
        },
        
        getMainList: function() {
            var i, obj;
            var list = root.getCurrentSession().getEnemyList()
            var count = list.getCount();
            var unit_list = [];

            for (i = 0; i < count; i++) {
                var unit = list.getData(i);

                // isThird が未定義 / false の場合は通常と同じ扱い
                if (unit.custom.isThird === "true") {
                    setThirdPartyUnit(unit);

                    unit_list.push(unit);
                }
            }

            obj = StructureBuilder.buildDataList();
            obj.setDataArray(unit_list);

            return obj;
        }
    };

    var alias16 = FilterControl.getNormalFilter;

    FilterControl.getNormalFilter = function(unitType) {
		var filter = 0;
		
		if (unitType === UnitType.PLAYER) {
			filter = UnitFilterFlag.PLAYER;
		}
		else if (unitType === UnitType.ENEMY) {
			filter = UnitFilterFlag.ENEMY;
		}
		else if (unitType === UnitType.ALLY) {
			filter = UnitFilterFlag.ALLY;
		}
		
		return filter;
	}

    var alias17 = FilterControl.getReverseFilter;

	FilterControl.getReverseFilter = function(unitType) {
		var filter = 0;
		
		if (unitType === UnitType.PLAYER) {
			filter = UnitFilterFlag.ENEMY;
		}
		else if (unitType === UnitType.ENEMY) {
			filter = UnitFilterFlag.PLAYER | UnitFilterFlag.ALLY;
		}
		else if (unitType === UnitType.ALLY) {
			filter = UnitFilterFlag.ENEMY;
		}
		
		return filter;
    }

    // 自分で追加したフィルター
	FilterControl.getUnitReverseFilter = function(unit) {
		var unitType = unit.getUnitType();
		var filter = 0;

		if (unit.custom.isThird === "true") {
            setThirdPartyUnit(unit);

			unitType = UnitType.THIRD;
		}

		if (unitType === UnitType.PLAYER) {
			filter = UnitFilterFlag.ENEMY | UnitFilterFlag.THIRD;
		}
		else if (unitType === UnitType.ENEMY) {
			filter = UnitFilterFlag.PLAYER | UnitFilterFlag.ALLY | UnitFilterFlag.THIRD;
		}
		else if (unitType === UnitType.THIRD) {
			filter = UnitFilterFlag.PLAYER | UnitFilterFlag.ALLY | UnitFilterFlag.ENEMY;
		}
		else if (unitType === UnitType.ALLY) {
			filter = UnitFilterFlag.ENEMY | UnitFilterFlag.THIRD;
		}
		
		return filter;
	}

    var alias18 = FilterControl.getBestFilter;

	FilterControl.getBestFilter = function(unitType, filterFlag) {
		var newFlag = 0;
		
		if (unitType === UnitType.ENEMY) {
			if (filterFlag & UnitFilterFlag.PLAYER) {
				newFlag |= UnitFilterFlag.ENEMY;
			}
			if (filterFlag & UnitFilterFlag.ENEMY) {
				newFlag |= UnitFilterFlag.PLAYER | UnitFilterFlag.ALLY;
			}
			
			filterFlag = newFlag;
		}
		
		return filterFlag;
	}

    var alias19 = FilterControl.getListArray;

    // ユニット取得に使用するフィルター
    FilterControl.getListArray = function(filter) {
		var listArray = [];
		
		if (filter & UnitFilterFlag.PLAYER) {
			listArray.push(PlayerList.getSortieList());
		}
		
		if (filter & UnitFilterFlag.ENEMY) {
			listArray.push(EnemyList.getAliveList());
		}
		
		if (filter & UnitFilterFlag.ALLY) {
			listArray.push(AllyList.getAliveList());
		}

		if (filter & UnitFilterFlag.THIRD) {
			listArray.push(ThirdList.getAliveList());
		}
		
		return listArray;	
	}

    var alias20 = FilterControl.getAliveListArray;

	FilterControl.getAliveListArray = function(filter) {
		var listArray = [];
		
		if (filter & UnitFilterFlag.PLAYER) {
			listArray.push(PlayerList.getAliveList());
		}
		
		if (filter & UnitFilterFlag.ENEMY) {
			listArray.push(EnemyList.getAliveList());
		}
		
		if (filter & UnitFilterFlag.ALLY) {
			listArray.push(AllyList.getAliveList());
		}

		if (filter & UnitFilterFlag.THIRD) {
			listArray.push(ThirdList.getAliveList());
		}

		return listArray;	
	}
    
    var alias21 = FilterControl.getDeathListArray;

	FilterControl.getDeathListArray = function(filter) {
		var listArray = [];
		
		if (filter & UnitFilterFlag.PLAYER) {
			listArray.push(PlayerList.getDeathList());
		}
		
		if (filter & UnitFilterFlag.ENEMY) {
			listArray.push(EnemyList.getDeathList());
		}
		
		if (filter & UnitFilterFlag.ALLY) {
			listArray.push(AllyList.getDeathList());
		}

		if (filter & UnitFilterFlag.THIRD) {
			listArray.push(ThirdList.getDeathList());
		}

		return listArray;	
	}
    
    var alias22 = FilterControl.isUnitTypeAllowed;

    // 有効な相手を取得
	FilterControl.isUnitTypeAllowed = function(unit, targetUnit) {
		var unitType = unit.getUnitType();
		var targetUnitType = targetUnit.getUnitType();
		
		if (unitType === UnitType.PLAYER) {
			return targetUnitType === UnitType.PLAYER;
		}
		else if (unitType === UnitType.ENEMY) {
			return targetUnitType === UnitType.ENEMY;
		}
		else if (unitType === UnitType.ALLY) {
			return targetUnitType === UnitType.ALLY;
		}
		else if (unitType === UnitType.THIRD) {
			return targetUnitType === UnitType.THIRD;
		}
		
		return false;
	}
    
    var alias23 = FilterControl.isReverseUnitTypeAllowed;

	FilterControl.isReverseUnitTypeAllowed = function(unit, targetUnit) {
		var unitType = unit.getUnitType();
		var targetUnitType = targetUnit.getUnitType();
		
		if (unitType === UnitType.PLAYER) {
			return targetUnitType === UnitType.ENEMY;
		}
		else if (unitType === UnitType.ENEMY) {
			return targetUnitType === UnitType.PLAYER || targetUnitType === UnitType.ALLY;
		}
		else if (unitType === UnitType.ALLY) {
			return targetUnitType === UnitType.ENEMY;
		}
		else if (unitType === UnitType.THIRD) {
			return targetUnitType === UnitType.THIRD;
		}
		
		return false;
	}
    
    var alias24 = FilterControl.isBestUnitTypeAllowed;

	FilterControl.isBestUnitTypeAllowed = function(unitType, targetUnitType, filterFlag) {
		filterFlag = this.getBestFilter(unitType, filterFlag);
		
		if ((filterFlag & UnitFilterFlag.PLAYER) && (targetUnitType === UnitType.PLAYER)) {
			return true;
		}
		
		if ((filterFlag & UnitFilterFlag.ALLY) && (targetUnitType === UnitType.ALLY)) {
			return true;
		}
		
		if ((filterFlag & UnitFilterFlag.ENEMY) && (targetUnitType === UnitType.ENEMY)) {
			return true;
		}

		if ((filterFlag & UnitFilterFlag.THIRD) && (targetUnitType === UnitType.THIRD)) {
			return true;
		}

		return false;
    }

    var alias25 = TurnControl.getActorList;

    TurnControl.getActorList = function() {
		var list = null;
		var turnType = root.getCurrentSession().getTurnType();
		
		if (turnType === TurnType.PLAYER) {
			list = PlayerList.getSortieList();
		}
		else if (turnType === TurnType.ENEMY) {
			list = EnemyList.getAliveList();
		}
		else if (turnType === TurnType.THIRD) {
			list = ThirdList.getAliveList();
		}
		else if (turnType === TurnType.ALLY) {
			list = AllyList.getAliveList();
		}
		
		return list;
	}
    
    var alias26 = TurnControl.getTargetList;

	TurnControl.getTargetList = function() {
		var list = null;
		var turnType = root.getCurrentSession().getTurnType();
		
		if (turnType === TurnType.PLAYER) {
			list = EnemyList.getAliveList();
		}
		else if (turnType === TurnType.ENEMY) {
			list = PlayerList.getSortieList();
		}
		else if (turnType === TurnType.ALLY) {
			list = EnemyList.getAliveList();
		}
		
		return list;
	}
})();