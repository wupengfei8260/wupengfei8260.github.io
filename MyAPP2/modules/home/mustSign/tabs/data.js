export function createMustSignTabData() {
    const tabMeta = [
        { id: 'zcw', label: '智橙网', count: 20 },
        { id: 'dispatch', label: '待派件', count: 14 },
        { id: 'signed', label: '已签收', count: 23 },
        { id: 'abnormal', label: '异常签收', count: 3 },
        { id: 'third', label: '第三方', count: 9 }
    ];

    const listData = {
        zcw: [
            {
                id: 'zcw-1',
                contactStatus: '已电联客户 家门口',
                deadline: '今日 11:20:44 前签收',
                trackingNo: '432343074439649',
                platform: 'tb',
                time: '16:14',
                nameMasked: '姜荣',
                nameFull: '姜荣',
                phoneMasked: '152****1086',
                phoneFull: '15245641086',
                callTag: '派前电联',
                address: '上海市浦东新区邹平路191号',
                tags: [
                    { text: '韵达智橙网', tone: 'danger' },
                    { text: '送货上门', tone: 'warn' },
                    { text: '多多专送', tone: 'plain' }
                ]
            },
            {
                id: 'zcw-2',
                contactStatus: '已电联客户 家门口',
                deadline: '今天12点前签收',
                warning: '分签预警',
                trackingNo: '432343074439649',
                platform: 'tb',
                time: '16:14',
                nameMasked: '孙菲芸',
                nameFull: '孙菲芸',
                phoneMasked: '152****1086',
                phoneFull: '15245641086',
                callTag: '电话勿扰',
                address: '上海市静安区江场三路272、278号市北高新技术服务园区17幢',
                tags: [
                    { text: '韵达智橙网', tone: 'danger' },
                    { text: '送货上门', tone: 'warn' },
                    { text: '多多专送', tone: 'plain' }
                ]
            }
        ],
        dispatch: [
            {
                id: 'dispatch-1',
                contactStatus: '已电联客户 放门口',
                deadline: '今日 13:40:12 前签收',
                trackingNo: '881239047561204',
                platform: 'jd',
                time: '15:22',
                nameMasked: '吴先生',
                nameFull: '吴先生',
                phoneMasked: '138****2201',
                phoneFull: '13876542201',
                callTag: '派前电联',
                address: '上海市普陀区真南路150号',
                tags: [
                    { text: '普通件', tone: 'plain' },
                    { text: '送货上门', tone: 'warn' }
                ]
            },
            {
                id: 'dispatch-2',
                contactStatus: '联系未果 待重试',
                deadline: '今日 18:30:00 前签收',
                trackingNo: '672140938115724',
                platform: 'pdd',
                time: '14:05',
                nameMasked: '陆女士',
                nameFull: '陆女士',
                phoneMasked: '139****7319',
                phoneFull: '13945627319',
                callTag: '电话勿扰',
                address: '上海市闵行区秀文路338号2号楼',
                tags: [
                    { text: '普通件', tone: 'plain' },
                    { text: '预约派送', tone: 'warn' }
                ]
            }
        ],
        signed: [
            {
                id: 'signed-1',
                contactStatus: '已签收',
                deadline: '今日 10:15:20 已签收',
                trackingNo: '553108740011246',
                platform: 'jd',
                time: '10:12',
                nameMasked: '顾先生',
                nameFull: '顾先生',
                phoneMasked: '136****0092',
                phoneFull: '13678090092',
                callTag: '已完成',
                address: '上海市长宁区金钟路658号',
                tags: [
                    { text: '签收完成', tone: 'plain' }
                ]
            }
        ],
        abnormal: [
            {
                id: 'abnormal-1',
                contactStatus: '异常签收 待复核',
                deadline: '今日 09:52:09 已签收',
                trackingNo: '210998117654233',
                platform: 'tb',
                time: '09:50',
                nameMasked: '龚女士',
                nameFull: '龚女士',
                phoneMasked: '151****2010',
                phoneFull: '15134212010',
                callTag: '待回访',
                address: '上海市宝山区沪太路4788弄',
                tags: [
                    { text: '异常签收', tone: 'danger' }
                ]
            }
        ],
        third: [
            {
                id: 'third-1',
                contactStatus: '第三方配送中',
                deadline: '今日 17:10:00 前签收',
                trackingNo: '332100874562221',
                platform: 'pdd',
                time: '12:42',
                nameMasked: '范先生',
                nameFull: '范先生',
                phoneMasked: '150****5521',
                phoneFull: '15078435521',
                callTag: '派前电联',
                address: '上海市嘉定区安亭镇墨玉路188号',
                tags: [
                    { text: '第三方', tone: 'plain' },
                    { text: '同城急送', tone: 'warn' }
                ]
            }
        ]
    };

    const zcwNames = ['姜荣', '孙菲芸', '吴敏', '许莉', '陈晓波', '李航', '王静', '赵谦', '周晨', '胡洁'];
    const zcwTrackPrefixes = ['43', '320', '46'];
    const zcwSeedRows = listData.zcw;
    const dispatchNames = ['吴先生', '陆女士', '周先生', '杨女士', '黄先生', '赵女士', '何先生'];
    const dispatchSeedRows = listData.dispatch;

    listData.zcw = Array.from({ length: 20 }, (_, index) => {
        const seed = zcwSeedRows[index % zcwSeedRows.length];
        const hour = String(11 + (index % 8)).padStart(2, '0');
        const minute = String((20 + index * 3) % 60).padStart(2, '0');
        const second = String((44 + index * 7) % 60).padStart(2, '0');
        const prefix = zcwTrackPrefixes[index % zcwTrackPrefixes.length];
        const suffix = String(343074430000 + index * 379 + 649);
        const track = `${prefix}${suffix}`.slice(0, 15).padEnd(15, '0');
        const platform = prefix === '46' ? 'pdd' : prefix === '43' ? 'tb' : 'jd';
        const name = zcwNames[index % zcwNames.length];
        const phoneTail = String(1086 + index).padStart(4, '0');
        const phoneFull = `1524564${String(1086 + index).padStart(4, '0')}`;
        const hasWarning = index % 5 === 1;
        const isThirdPartyReverseItem = index === 7;

        return {
            ...seed,
            id: `zcw-${index + 1}`,
            deadline: `今日 ${hour}:${minute}:${second} 前签收`,
            warning: hasWarning ? '分签预警' : undefined,
            trackingNo: isThirdPartyReverseItem ? `${track.slice(0, 11)}4070` : track,
            platform: isThirdPartyReverseItem ? 'pdd' : platform,
            time: `${String(9 + (index % 10)).padStart(2, '0')}:${String((14 + index * 2) % 60).padStart(2, '0')}`,
            nameMasked: name,
            nameFull: name,
            phoneMasked: `152****${phoneTail}`,
            phoneFull,
            callTag: index % 4 === 0 ? '电话勿扰' : '派前电联',
            address: index % 3 === 0 ? '上海市浦东新区邹平路191号' : '上海市静安区江场三路272、278号市北高新技术服务园区17幢',
            tags: isThirdPartyReverseItem
                ? [
                    { text: '韵达智橙网', tone: 'danger' },
                    { text: '送货上门', tone: 'warn' },
                    { text: '第三方', tone: 'plain' }
                ]
                : seed.tags.map((tag) => ({ ...tag }))
        };
    });

    listData.dispatch = Array.from({ length: 14 }, (_, index) => {
        const seed = dispatchSeedRows[index % dispatchSeedRows.length];
        const track = `88${String(123904756000000 + index * 271 + 204).slice(0, 13)}`;
        const name = dispatchNames[index % dispatchNames.length];
        const phoneTail = String(2201 + index).padStart(4, '0');
        const phoneFull = `1387654${phoneTail}`;
        const hour = String(11 + (index % 8)).padStart(2, '0');
        const minute = String((18 + index * 4) % 60).padStart(2, '0');
        const second = String((12 + index * 5) % 60).padStart(2, '0');

        return {
            ...seed,
            id: `dispatch-${index + 1}`,
            deadline: `今日 ${hour}:${minute}:${second} 前签收`,
            trackingNo: track,
            platform: index % 3 === 0 ? 'jd' : index % 3 === 1 ? 'tb' : 'pdd',
            time: `${String(10 + (index % 9)).padStart(2, '0')}:${String((5 + index * 3) % 60).padStart(2, '0')}`,
            nameMasked: name,
            nameFull: name,
            phoneMasked: `138****${phoneTail}`,
            phoneFull,
            callTag: index % 4 === 0 ? '电话勿扰' : '派前电联',
            address: index % 2 === 0 ? '上海市普陀区真南路150号' : '上海市闵行区秀文路338号2号楼',
            tags: index % 2 === 0
                ? [{ text: '普通件', tone: 'plain' }, { text: '送货上门', tone: 'warn' }]
                : [{ text: '普通件', tone: 'plain' }, { text: '预约派送', tone: 'warn' }]
        };
    });

    tabMeta.forEach((tab) => {
        if (Array.isArray(listData[tab.id])) {
            tab.count = listData[tab.id].length;
        }
    });

    return { tabMeta, listData };
}
