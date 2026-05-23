class TableTennisAnalyzer {
    constructor() {
        this.video = document.getElementById('videoPlayer');
        this.canvas = document.getElementById('poseCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 标准视频相关
        this.standardVideo = document.getElementById('standardVideoPlayer');
        this.standardCanvas = document.getElementById('standardPoseCanvas');
        this.standardCtx = this.standardCanvas?.getContext('2d');
        
        this.pose = null;
        this.camera = null;
        this.isAnalyzing = false;
        this.poseResults = [];
        this.standardPoseResults = [];
        this.standardAnalysisResult = null;
        this.currentFrame = 0;
        this.totalFrames = 0;
        this.fps = 30;
        this.dominantHand = 'right'; // 默认右手持拍
        this.trajectory = [];
        this.keyFrames = [];
        this.analysisResult = null;
        this.standardActions = null;
        this.chartZoom = 1; // 图表缩放比例
        this.chartOffset = 0; // 图表偏移量
        this.hasStandardVideo = false;
        this.isProcessingStandardVideo = false;
        
        this.init();
    }

    async init() {
        await this.loadStandardActions();
        this.setupEventListeners();
        this.setupMediaPipe();
        this.setupChartZoomControls();
        this.checkFirstTimeUser();
    }

    async loadStandardActions() {
        this.standardActions = this.getDefaultActions();
    }

    getDefaultActions() {
        return {
            forehand: {
                name: '正手攻球',
                nameEn: 'Forehand Attack',
                elbowAngle: { min: 70, max: 110 },
                shoulderAngle: { min: 30, max: 60 },
                wristAngle: { min: 150, max: 180 },
                hipAngle: { min: 80, max: 120 },
                kneeAngle: { min: 100, max: 140 },
                sequence: ['prepare', 'backswing', 'forward', 'followthrough'],
                timing: { prepare: 0.2, backswing: 0.3, forward: 0.3, followthrough: 0.2 },
                movement: { verticalRange: 40, horizontalRange: 30, speed: 'medium', direction: 'up' }
            },
            forehandLoop: {
                name: '正手拉球',
                nameEn: 'Forehand Loop',
                elbowAngle: { min: 80, max: 120 },
                shoulderAngle: { min: 40, max: 70 },
                wristAngle: { min: 140, max: 175 },
                hipAngle: { min: 85, max: 125 },
                kneeAngle: { min: 80, max: 120 },
                sequence: ['prepare', 'backswing', 'forward', 'followthrough'],
                timing: { prepare: 0.15, backswing: 0.35, forward: 0.35, followthrough: 0.15 },
                movement: { verticalRange: 80, horizontalRange: 40, speed: 'fast', direction: 'up' }
            },
            forehandFlick: {
                name: '正手挑打',
                nameEn: 'Forehand Flick',
                elbowAngle: { min: 90, max: 130 },
                shoulderAngle: { min: 20, max: 45 },
                wristAngle: { min: 100, max: 140 },
                hipAngle: { min: 90, max: 130 },
                kneeAngle: { min: 70, max: 100 },
                sequence: ['prepare', 'contact', 'followthrough'],
                timing: { prepare: 0.3, contact: 0.4, followthrough: 0.3 },
                movement: { verticalRange: 25, horizontalRange: 20, speed: 'fast', direction: 'up' }
            },
            backhand: {
                name: '反手攻球',
                nameEn: 'Backhand Attack',
                elbowAngle: { min: 60, max: 90 },
                shoulderAngle: { min: 20, max: 50 },
                wristAngle: { min: 120, max: 160 },
                hipAngle: { min: 70, max: 110 },
                kneeAngle: { min: 90, max: 130 },
                sequence: ['prepare', 'backswing', 'forward', 'followthrough'],
                timing: { prepare: 0.2, backswing: 0.3, forward: 0.3, followthrough: 0.2 },
                movement: { verticalRange: 30, horizontalRange: 45, speed: 'medium', direction: 'horizontal' }
            },
            backhandLoop: {
                name: '反手拉球',
                nameEn: 'Backhand Loop',
                elbowAngle: { min: 70, max: 100 },
                shoulderAngle: { min: 25, max: 55 },
                wristAngle: { min: 130, max: 165 },
                hipAngle: { min: 75, max: 115 },
                kneeAngle: { min: 85, max: 125 },
                sequence: ['prepare', 'backswing', 'forward', 'followthrough'],
                timing: { prepare: 0.15, backswing: 0.35, forward: 0.35, followthrough: 0.15 },
                movement: { verticalRange: 60, horizontalRange: 50, speed: 'fast', direction: 'up' }
            },
            backhandFlick: {
                name: '反手撕球',
                nameEn: 'Backhand Flick',
                elbowAngle: { min: 65, max: 95 },
                shoulderAngle: { min: 15, max: 40 },
                wristAngle: { min: 140, max: 170 },
                hipAngle: { min: 80, max: 120 },
                kneeAngle: { min: 95, max: 135 },
                sequence: ['prepare', 'backswing', 'contact', 'followthrough'],
                timing: { prepare: 0.2, backswing: 0.25, contact: 0.35, followthrough: 0.2 },
                movement: { verticalRange: 50, horizontalRange: 55, speed: 'fast', direction: 'up' }
            },
            backhandTwist: {
                name: '反手拧拉',
                nameEn: 'Backhand Twist',
                elbowAngle: { min: 80, max: 110 },
                shoulderAngle: { min: 20, max: 45 },
                wristAngle: { min: 90, max: 130 },
                hipAngle: { min: 85, max: 125 },
                kneeAngle: { min: 75, max: 110 },
                sequence: ['prepare', 'backswing', 'contact', 'followthrough'],
                timing: { prepare: 0.2, backswing: 0.25, contact: 0.35, followthrough: 0.2 },
                movement: { verticalRange: 45, horizontalRange: 35, speed: 'fast', direction: 'up' }
            },
            push: {
                name: '搓球',
                nameEn: 'Push',
                elbowAngle: { min: 90, max: 130 },
                shoulderAngle: { min: 25, max: 55 },
                wristAngle: { min: 130, max: 170 },
                hipAngle: { min: 75, max: 115 },
                kneeAngle: { min: 95, max: 135 },
                sequence: ['prepare', 'contact', 'followthrough'],
                timing: { prepare: 0.4, contact: 0.3, followthrough: 0.3 },
                movement: { verticalRange: 20, horizontalRange: 30, speed: 'slow', direction: 'down' }
            },
            chop: {
                name: '削球',
                nameEn: 'Chop',
                elbowAngle: { min: 120, max: 160 },
                shoulderAngle: { min: 30, max: 60 },
                wristAngle: { min: 150, max: 180 },
                hipAngle: { min: 60, max: 100 },
                kneeAngle: { min: 80, max: 120 },
                sequence: ['prepare', 'backswing', 'contact', 'followthrough'],
                timing: { prepare: 0.25, backswing: 0.3, contact: 0.25, followthrough: 0.2 },
                movement: { verticalRange: 70, horizontalRange: 40, speed: 'medium', direction: 'down' }
            },
            serve: {
                name: '发球',
                nameEn: 'Serve',
                elbowAngle: { min: 75, max: 115 },
                shoulderAngle: { min: 35, max: 65 },
                wristAngle: { min: 145, max: 180 },
                hipAngle: { min: 80, max: 120 },
                kneeAngle: { min: 100, max: 140 },
                sequence: ['toss', 'backswing', 'contact', 'followthrough'],
                timing: { toss: 0.2, backswing: 0.3, contact: 0.3, followthrough: 0.2 },
                movement: { verticalRange: 60, horizontalRange: 35, speed: 'fast', direction: 'down' },
                requireBothHands: true
            },
            serveForehand: {
                name: '正手发球',
                nameEn: 'Forehand Serve',
                elbowAngle: { min: 80, max: 110 },
                shoulderAngle: { min: 40, max: 70 },
                wristAngle: { min: 150, max: 180 },
                hipAngle: { min: 75, max: 115 },
                kneeAngle: { min: 95, max: 135 },
                sequence: ['toss', 'backswing', 'contact', 'followthrough'],
                timing: { toss: 0.2, backswing: 0.3, contact: 0.3, followthrough: 0.2 },
                movement: { verticalRange: 70, horizontalRange: 45, speed: 'fast', direction: 'down' },
                requireBothHands: true
            },
            block: {
                name: '反手挡球',
                nameEn: 'Backhand Block',
                elbowAngle: { min: 100, max: 140 },
                shoulderAngle: { min: 15, max: 40 },
                wristAngle: { min: 150, max: 180 },
                hipAngle: { min: 85, max: 125 },
                kneeAngle: { min: 100, max: 140 },
                sequence: ['prepare', 'contact', 'followthrough'],
                timing: { prepare: 0.4, contact: 0.4, followthrough: 0.2 },
                movement: { verticalRange: 15, horizontalRange: 25, speed: 'slow', direction: 'horizontal' }
            }
        };
    }

    setupEventListeners() {
        document.getElementById('uploadBtn').addEventListener('click', () => {
            this.showVideoGuide();
        });

        document.getElementById('videoInput').addEventListener('change', (e) => {
            this.handleVideoUpload(e.target.files[0]);
        });

        document.getElementById('uploadStandardBtn').addEventListener('click', () => {
            document.getElementById('standardVideoInput').click();
        });

        document.getElementById('standardVideoInput').addEventListener('change', (e) => {
            this.handleStandardVideoUpload(e.target.files[0]);
        });

        document.getElementById('cameraBtn').addEventListener('click', () => {
            this.startCamera();
        });

        document.getElementById('analyzeBtn').addEventListener('click', () => {
            // 如果有标准视频，则进行对比分析，否则只分析用户视频
            if (this.hasStandardVideo) {
                this.startCompareAnalysis();
            } else {
                this.startAnalysis();
            }
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportReport();
        });

        document.getElementById('exportVideoBtn').addEventListener('click', () => {
            this.exportAnalysisVideo();
        });

        document.getElementById('playPauseBtn').addEventListener('click', () => {
            this.togglePlayPause();
        });

        document.getElementById('progressBar').addEventListener('input', (e) => {
            this.seekTo(e.target.value);
        });

        document.getElementById('muteBtn').addEventListener('click', () => {
            this.toggleMute();
        });

        document.getElementById('volumeBar').addEventListener('input', (e) => {
            this.setVolume(e.target.value);
        });

        document.getElementById('speedSelect').addEventListener('change', (e) => {
            this.setPlaybackSpeed(e.target.value);
        });

        document.getElementById('prevFrameBtn').addEventListener('click', () => {
            this.previousFrame();
        });

        document.getElementById('nextFrameBtn').addEventListener('click', () => {
            this.nextFrame();
        });

        document.getElementById('captureFrameBtn').addEventListener('click', () => {
            this.captureFrame();
        });

        document.getElementById('markKeyFrameBtn').addEventListener('click', () => {
            this.markKeyFrame();
        });

        document.getElementById('exportPDFBtn').addEventListener('click', () => {
            this.exportPDF();
        });

        document.getElementById('exportTextBtn').addEventListener('click', () => {
            this.exportText();
        });

        document.getElementById('closeGuideBtn').addEventListener('click', () => {
            this.closeGuide();
        });

        document.getElementById('confirmVideoGuide').addEventListener('click', () => {
            this.confirmVideoGuide();
        });

        document.getElementById('skipVideoGuide').addEventListener('click', () => {
            this.skipVideoGuide();
        });

        document.getElementById('actionTypeSelect').addEventListener('change', () => {
            this.checkAnalysisReady();
        });

        document.getElementById('cameraPositionSelect').addEventListener('change', () => {
            this.checkAnalysisReady();
        });

        document.getElementById('fullscreenBtn').addEventListener('click', () => {
            this.toggleFullscreen(false);
        });
        
        document.getElementById('standardFullscreenBtn').addEventListener('click', () => {
            this.toggleFullscreen(true);
        });

        document.addEventListener('fullscreenchange', () => {
            this.onFullscreenChange();
        });

        this.video.addEventListener('loadedmetadata', () => {
            this.setupCanvas();
            this.updateDuration();
            this.enableControls();
        });

        this.video.addEventListener('timeupdate', () => {
            this.updateProgress();
        });

        this.video.addEventListener('ended', () => {
            this.onVideoEnded();
        });
    }

    setupMediaPipe() {
        this.pose = new Pose({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
            }
        });

        this.pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
            maxNumPoses: 5
        });

        this.pose.onResults((results) => {
            this.onPoseResults(results);
        });
    }

    setupCanvas() {
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
    }

    async handleVideoUpload(file) {
        if (!file) return;

        const validTypes = ['video/mp4', 'video/webm', 'video/ogg'];
        if (!validTypes.includes(file.type)) {
            alert('请上传支持的视频格式（MP4、WebM、OGG）');
            return;
        }

        const url = URL.createObjectURL(file);
        this.video.src = url;
        this.poseResults = [];
        this.trajectory = [];
        this.keyFrames = [];
        this.currentFrame = 0;
        
        document.getElementById('analyzeBtn').disabled = false;
        this.checkCompareReady();
        this.resetAnalysis();
    }

    async handleStandardVideoUpload(file) {
        if (!file) return;

        const validTypes = ['video/mp4', 'video/webm', 'video/ogg'];
        if (!validTypes.includes(file.type)) {
            alert('请上传支持的视频格式（MP4、WebM、OGG）');
            return;
        }

        const url = URL.createObjectURL(file);
        this.standardVideo.src = url;
        this.hasStandardVideo = true;
        this.standardPoseResults = [];
        this.standardAnalysisResult = null;

        // 直接设置canvas大小（使用DOM获取确保元素存在）
        const standardCanvas = document.getElementById('standardPoseCanvas');
        if (standardCanvas) {
            standardCanvas.width = this.standardVideo.videoWidth || 640;
            standardCanvas.height = this.standardVideo.videoHeight || 480;
            this.standardCtx = standardCanvas.getContext('2d');
        }
        
        this.checkCompareReady();
    }

    checkCompareReady() {
        // 此方法保留以便向后兼容，实际逻辑已移至 checkAnalysisReady
    }

    async startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            });

            this.video.srcObject = stream;
            await this.video.play();

            this.camera = new Camera(this.video, {
                onFrame: async () => {
                    if (this.isAnalyzing) {
                        await this.pose.send({ image: this.video });
                    }
                },
                width: 1280,
                height: 720
            });

            await this.camera.start();
            document.getElementById('analyzeBtn').disabled = false;
            this.resetAnalysis();

        } catch (error) {
            console.error('Camera error:', error);
            alert('无法访问摄像头，请检查权限设置');
        }
    }

    checkAnalysisReady() {
        const actionType = document.getElementById('actionTypeSelect').value;
        const hasVideo = this.video.src;
        const analyzeBtn = document.getElementById('analyzeBtn');
        
        // 分析按钮在有动作类型和用户视频时可用
        // 如果同时有标准视频，点击后会自动进行对比分析
        analyzeBtn.disabled = !actionType || !hasVideo;
    }

    toggleFullscreen(isStandard = false) {
        const containerClass = isStandard ? '.standard-video' : '.user-video';
        const container = document.querySelector(containerClass);
        
        if (!document.fullscreenElement) {
            container.requestFullscreen().catch(err => {
                console.error('全屏失败:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    onFullscreenChange() {
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        const standardFullscreenBtn = document.getElementById('standardFullscreenBtn');
        
        if (document.fullscreenElement) {
            fullscreenBtn.innerHTML = '⛶';
            fullscreenBtn.title = '退出全屏';
            standardFullscreenBtn.innerHTML = '⛶';
            standardFullscreenBtn.title = '退出全屏';
        } else {
            fullscreenBtn.innerHTML = '⛶';
            fullscreenBtn.title = '全屏';
            standardFullscreenBtn.innerHTML = '⛶';
            standardFullscreenBtn.title = '全屏';
        }
    }

    async startAnalysis() {
        if (this.isAnalyzing) {
            this.stopAnalysis();
            return;
        }
        
        const actionType = document.getElementById('actionTypeSelect').value;
        const cameraPosition = document.getElementById('cameraPositionSelect').value;
        
        if (!actionType) {
            alert('请先选择要分析的动作类型');
            return;
        }
        
        this.selectedActionType = actionType;
        this.cameraPosition = cameraPosition;

        this.isAnalyzing = true;
        this.poseResults = [];
        this.trajectory = [];
        document.getElementById('analyzeBtn').textContent = '停止分析';
        document.getElementById('loadingOverlay').classList.add('active');

        console.log('开始分析，动作类型:', actionType);
        console.log('是否有摄像头:', !!this.camera);
        console.log('视频时长:', this.video?.duration);
        console.log('MediaPipe实例:', !!this.pose);

        if (!this.camera) {
            await this.processVideo();
        } else {
            await this.processCameraStream();
        }
    }

    stopAnalysis() {
        this.isAnalyzing = false;
        document.getElementById('analyzeBtn').textContent = '分析动作';
        document.getElementById('loadingOverlay').classList.remove('active');
    }

    async startCompareAnalysis() {
        const actionType = document.getElementById('actionTypeSelect').value;
        
        if (!actionType) {
            alert('请先选择要分析的动作类型');
            return;
        }

        this.selectedActionType = actionType;
        
        document.getElementById('standardLoadingOverlay').classList.add('active');
        document.getElementById('loadingOverlay').classList.add('active');

        // 设置分析标志
        this.isAnalyzing = true;

        // 先分析标准视频
        await this.processStandardVideo();
        
        // 再分析用户视频
        await this.processVideo();

        // 显示对比结果
        this.displayCompareResults();
        
        document.getElementById('standardLoadingOverlay').classList.remove('active');
        document.getElementById('loadingOverlay').classList.remove('active');
        
        // 重置分析标志
        this.isAnalyzing = false;
    }

    async processStandardVideo() {
        const video = this.standardVideo;
        const duration = video.duration;
        const fps = this.fps;
        const totalFrames = Math.floor(duration * fps);

        // 使用DOM获取确保标准canvas存在
        const standardCanvas = document.getElementById('standardPoseCanvas');
        const standardCtx = standardCanvas?.getContext('2d');
        
        if (standardCanvas) {
            standardCanvas.width = video.videoWidth || 640;
            standardCanvas.height = video.videoHeight || 480;
        }

        // 设置标志，表示正在处理标准视频
        this.isProcessingStandardVideo = true;
        this.tempStandardResults = [];
        this.currentFrame = 0;

        for (let frame = 0; frame < totalFrames; frame++) {
            const time = frame / fps;
            video.currentTime = time;

            await new Promise(resolve => {
                video.onseeked = resolve;
            });

            // 发送图像到MediaPipe，结果会通过onPoseResults回调处理
            try {
                await this.pose.send({ image: video });
            } catch (error) {
                console.warn('MediaPipe处理帧失败，跳过:', error);
                continue;
            }

            // 等待回调处理完成
            await this.delay(Math.max(33, 1000 / fps));

            // 更新进度条
            const progress = ((frame + 1) / totalFrames) * 100;
            this.updateProgressBar(progress, '正在分析标准视频...', true);

            this.currentFrame++;
        }

        // 清理标志
        this.isProcessingStandardVideo = false;
        
        // 保存标准视频分析结果
        this.standardPoseResults = [...this.tempStandardResults];
        this.tempStandardResults = [];
        
        // 临时切换状态进行分析
        const originalResults = this.poseResults;
        const originalTrajectory = this.trajectory;
        this.poseResults = this.standardPoseResults;
        this.trajectory = [];

        // 分析标准视频（使用与用户视频完全相同的评分规则）
        this.detectDominantHand();
        const standardActionData = this.standardActions[this.selectedActionType];
        const standardActionType = {
            type: this.selectedActionType,
            name: standardActionData.name,
            nameEn: standardActionData.nameEn,
            score: 100
        };
        
        // 使用相同的评分方法
        const standardScores = this.calculateScores(standardActionType);
        
        this.standardAnalysisResult = {
            actionType: standardActionType,
            scores: standardScores
        };

        // 恢复原始状态
        this.poseResults = originalResults;
        this.trajectory = originalTrajectory;
    }

    drawPoseOnCanvas(landmarks, ctx, canvas, isStandard = false) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const connections = [
            [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
            [11, 23], [12, 24], [23, 24], [23, 25], [24, 26],
            [25, 27], [26, 28], [27, 29], [28, 30], [29, 31], [30, 32],
            [15, 17], [15, 19], [15, 21], [16, 18], [16, 20], [16, 22]
        ];

        ctx.strokeStyle = isStandard ? '#4299e1' : '#00ff00';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        for (const connection of connections) {
            const start = landmarks[connection[0]];
            const end = landmarks[connection[1]];
            
            if (start && end) {
                ctx.beginPath();
                ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
                ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
                ctx.stroke();
            }
        }

        // 绘制关键点
        ctx.fillStyle = isStandard ? '#4299e1' : '#00ff00';
        for (const landmark of landmarks) {
            if (landmark) {
                ctx.beginPath();
                ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    displayCompareResults() {
        const compareSection = document.getElementById('compareResults');
        compareSection.style.display = 'block';

        // 更新标准视频分数
        if (this.standardAnalysisResult) {
            const scores = this.standardAnalysisResult.scores;
            const standardTotal = Math.round((scores.posture + scores.continuity + scores.power + scores.completeness) / 4);
            document.getElementById('standardScore').textContent = standardTotal;
            document.getElementById('standardPosture').textContent = scores.posture || '--';
            document.getElementById('standardContinuity').textContent = scores.continuity || '--';
            document.getElementById('standardPower').textContent = scores.power || '--';
            document.getElementById('standardCompleteness').textContent = scores.completeness || '--';
        }

        // 更新用户视频分数
        if (this.analysisResult) {
            const scores = this.analysisResult.scores;
            const userTotal = Math.round((scores.posture + scores.continuity + scores.power + scores.completeness) / 4);
            document.getElementById('userScore').textContent = userTotal;
            document.getElementById('userPosture').textContent = scores.posture || '--';
            document.getElementById('userContinuity').textContent = scores.continuity || '--';
            document.getElementById('userPower').textContent = scores.power || '--';
            document.getElementById('userCompleteness').textContent = scores.completeness || '--';
        }

        // 生成差异分析
        this.generateDifferenceAnalysis();
    }

    generateDifferenceAnalysis() {
        const differenceList = document.getElementById('differenceAnalysis');
        
        if (!this.standardAnalysisResult || !this.analysisResult) {
            differenceList.innerHTML = '<p>暂无对比数据</p>';
            return;
        }

        const standard = this.standardAnalysisResult.scores;
        const user = this.analysisResult.scores;
        const actionType = this.analysisResult?.actionType?.type || 'forehand';
        const actionData = this.standardActions[actionType];
        
        const differences = [];
        const suggestions = [];
        
        // 总体评分差距
        const totalStandard = standard.posture + standard.continuity + standard.power + standard.completeness;
        const totalUser = user.posture + user.continuity + user.power + user.completeness;
        const totalDiff = totalUser - totalStandard;
        
        if (totalDiff < -10) {
            differences.push({
                text: `总体评分低于标准 ${Math.abs(totalDiff)} 分，需要重点改进`,
                type: 'negative'
            });
        } else if (totalDiff > 10) {
            differences.push({
                text: `总体评分高于标准 ${totalDiff} 分，表现非常出色！`,
                type: 'positive'
            });
        } else {
            differences.push({
                text: `总体评分与标准接近，差距为 ${totalDiff} 分`,
                type: 'neutral'
            });
        }
        
        // 姿态规范性对比和具体建议
        const postureDiff = user.posture - standard.posture;
        if (postureDiff < -5) {
            differences.push({
                text: `姿态规范性低于标准 ${Math.abs(postureDiff)} 分`,
                type: 'negative'
            });
            
            // 根据动作类型提供具体建议
            if (actionType === 'forehand') {
                suggestions.push({
                    text: '【姿态修正】正手攻球时，双脚分开与肩同宽，膝盖微屈，重心略前倾',
                    type: 'posture'
                });
                suggestions.push({
                    text: '【站位建议】身体侧对球台，左脚在前（右手持拍），右脚在后',
                    type: 'posture'
                });
            } else if (actionType === 'backhand') {
                suggestions.push({
                    text: '【姿态修正】反手攻球时，身体正对球台，双脚平行站立',
                    type: 'posture'
                });
                suggestions.push({
                    text: '【站位建议】膝盖微屈，重心保持在两脚之间',
                    type: 'posture'
                });
            }
        } else if (postureDiff > 5) {
            differences.push({
                text: `姿态规范性高于标准 ${postureDiff} 分`,
                type: 'positive'
            });
        }

        // 动作连贯性对比和具体建议
        const continuityDiff = user.continuity - standard.continuity;
        if (continuityDiff < -5) {
            differences.push({
                text: `动作连贯性低于标准 ${Math.abs(continuityDiff)} 分`,
                type: 'negative'
            });
            suggestions.push({
                text: '【连贯性建议】注意动作衔接的流畅性，避免停顿和僵硬',
                type: 'continuity'
            });
            suggestions.push({
                text: '【节奏控制】练习时使用节拍器，保持稳定的动作节奏',
                type: 'continuity'
            });
        } else if (continuityDiff > 5) {
            differences.push({
                text: `动作连贯性高于标准 ${continuityDiff} 分`,
                type: 'positive'
            });
        }

        // 发力合理性对比和具体建议
        const powerDiff = user.power - standard.power;
        if (powerDiff < -5) {
            differences.push({
                text: `发力合理性低于标准 ${Math.abs(powerDiff)} 分`,
                type: 'negative'
            });
            suggestions.push({
                text: '【发力建议】注意发力顺序：蹬地→转腰→挥臂→手腕发力',
                type: 'power'
            });
            suggestions.push({
                text: '【力量传递】力量从腿部开始，通过腰腹传递到手臂',
                type: 'power'
            });
        } else if (powerDiff > 5) {
            differences.push({
                text: `发力合理性高于标准 ${powerDiff} 分`,
                type: 'positive'
            });
        }

        // 动作完整性对比和具体建议
        const completenessDiff = user.completeness - standard.completeness;
        if (completenessDiff < -5) {
            differences.push({
                text: `动作完整性低于标准 ${Math.abs(completenessDiff)} 分`,
                type: 'negative'
            });
            suggestions.push({
                text: '【完整性建议】确保动作包含完整的准备、挥拍和随挥阶段',
                type: 'completeness'
            });
            suggestions.push({
                text: '【随挥练习】注意击球后的随挥动作，保持手臂伸直',
                type: 'completeness'
            });
        } else if (completenessDiff > 5) {
            differences.push({
                text: `动作完整性高于标准 ${completenessDiff} 分`,
                type: 'positive'
            });
        }
        
        // 基于关节角度的具体建议
        if (this.standardPoseResults.length > 0 && this.poseResults.length > 0) {
            const isRightHanded = this.dominantHand === 'right';
            const elbowIdx = isRightHanded ? 14 : 13;
            const shoulderIdx = isRightHanded ? 12 : 11;
            const wristIdx = isRightHanded ? 16 : 15;
            
            // 计算平均角度
            const avgUserElbow = this.calculateAverageAngle(this.poseResults, shoulderIdx, elbowIdx, wristIdx);
            const avgStandardElbow = this.calculateAverageAngle(this.standardPoseResults, shoulderIdx, elbowIdx, wristIdx);
            
            const elbowAngleDiff = avgUserElbow - avgStandardElbow;
            if (Math.abs(elbowAngleDiff) > 10) {
                if (elbowAngleDiff > 0) {
                    suggestions.push({
                        text: `【肘部角度】您的肘部角度偏大（${avgUserElbow.toFixed(1)}° vs 标准${avgStandardElbow.toFixed(1)}°），建议减小肘部弯曲程度`,
                        type: 'angle'
                    });
                } else {
                    suggestions.push({
                        text: `【肘部角度】您的肘部角度偏小（${avgUserElbow.toFixed(1)}° vs 标准${avgStandardElbow.toFixed(1)}°），建议适当增加肘部弯曲`,
                        type: 'angle'
                    });
                }
            }
        }

        if (differences.length === 0 && suggestions.length === 0) {
            differences.push({
                text: '您的动作与标准视频非常接近，继续保持！',
                type: 'neutral'
            });
        }

        // 生成HTML
        let html = '<div class="difference-summary">';
        html += '<h4>📊 差距总结</h4>';
        html += differences.map(d => 
            `<div class="difference-item ${d.type}">${d.text}</div>`
        ).join('');
        html += '</div>';
        
        if (suggestions.length > 0) {
            html += '<div class="suggestion-list">';
            html += '<h4>💡 修正建议</h4>';
            html += suggestions.map(s => 
                `<div class="suggestion-item ${s.type}">${s.text}</div>`
            ).join('');
            html += '</div>';
        }
        
        differenceList.innerHTML = html;
    }

    calculateAverageAngle(poseResults, point1Idx, point2Idx, point3Idx) {
        let sum = 0;
        let count = 0;
        
        for (const result of poseResults) {
            const landmarks = result.landmarks;
            const p1 = landmarks[point1Idx];
            const p2 = landmarks[point2Idx];
            const p3 = landmarks[point3Idx];
            
            if (p1?.visibility > 0.5 && p2?.visibility > 0.5 && p3?.visibility > 0.5) {
                const angle = this.calculateAngle(p1, p2, p3);
                sum += angle;
                count++;
            }
        }
        
        return count > 0 ? sum / count : 0;
    }

    async processVideo() {
        const video = this.video;
        const duration = video.duration;
        const fps = this.fps;
        const totalFrames = Math.floor(duration * fps);
        this.totalFrames = totalFrames;

        console.log('processVideo开始，总帧数:', totalFrames);

        for (let frame = 0; frame < totalFrames; frame++) {
            if (!this.isAnalyzing) break;

            const time = frame / fps;
            video.currentTime = time;

            await new Promise(resolve => {
                video.onseeked = resolve;
            });

            try {
                await this.pose.send({ image: video });
            } catch (error) {
                console.warn('MediaPipe处理帧失败，跳过:', error);
                continue;
            }
            
            const progress = ((frame + 1) / totalFrames) * 100;
            this.updateProgressBar(progress, this.hasStandardVideo ? '正在分析用户视频...' : '正在分析...', false);
            
            await this.delay(Math.max(33, 1000 / fps));
        }

        console.log('processVideo结束，收集到的poseResults数量:', this.poseResults.length);

        if (this.isAnalyzing) {
            this.updateProgressBar(100, '分析完成', false);
            this.analyzeMotion();
            this.stopAnalysis();
        }
    }

    updateProgressBar(progress, text = '正在分析...', isStandard = false) {
        const progressBarId = isStandard ? 'standardProgress' : 'analysisProgress';
        const progressTextId = isStandard ? 'standardProgressText' : 'progressText';
        const loadingOverlayId = isStandard ? 'standardLoadingOverlay' : 'loadingOverlay';
        
        const progressBar = document.getElementById(progressBarId);
        const progressText = document.getElementById(progressTextId);
        const loadingOverlay = document.getElementById(loadingOverlayId);
        const loadingText = loadingOverlay?.querySelector('.loading-text');
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${Math.round(progress)}%`;
        }
        
        if (loadingText) {
            loadingText.textContent = text;
        }
    }

    async processCameraStream() {
        while (this.isAnalyzing) {
            await this.delay(1000 / this.fps);
        }
    }

    onPoseResults(results) {
        console.log('onPoseResults被调用，results:', !!results);
        
        if (!results) {
            console.log('没有检测到results');
            return;
        }

        let landmarksList = [];
        
        if (results.multiPoseLandmarks && Array.isArray(results.multiPoseLandmarks)) {
            landmarksList = results.multiPoseLandmarks;
        } else if (results.poseLandmarks) {
            landmarksList = [results.poseLandmarks];
        }
        
        console.log('检测到的人数:', landmarksList.length);
        
        if (landmarksList.length === 0) {
            console.log('没有检测到任何人');
            return;
        }

        let targetLandmarks = landmarksList[0];
        
        if (landmarksList.length > 1) {
            targetLandmarks = this.selectMainPerson(landmarksList);
        }
        
        if (!targetLandmarks) {
            targetLandmarks = landmarksList[0];
        }

        if (this.isProcessingStandardVideo) {
            const standardCanvas = document.getElementById('standardPoseCanvas');
            const standardCtx = standardCanvas?.getContext('2d');
            
            const frameData = {
                frame: this.currentFrame,
                timestamp: this.standardVideo?.currentTime || 0,
                landmarks: targetLandmarks
            };
            this.tempStandardResults.push(frameData);
            
            if (standardCtx && standardCanvas) {
                this.drawPoseOnCanvas(targetLandmarks, standardCtx, standardCanvas, true);
            }
        } else {
            const frameData = {
                frame: this.currentFrame,
                timestamp: this.video.currentTime,
                landmarks: targetLandmarks,
                image: this.captureFrameData()
            };

            this.poseResults.push(frameData);
            this.drawPose(targetLandmarks);
            this.updateTrajectory(targetLandmarks);
            this.currentFrame++;
        }
    }

    selectMainPerson(landmarksList) {
        if (landmarksList.length === 1) {
            return landmarksList[0];
        }

        if (!this.mainPersonIndex) {
            this.mainPersonIndex = 0;
        }

        if (this.mainPersonIndex < landmarksList.length) {
            return landmarksList[this.mainPersonIndex];
        }

        const canvasWidth = this.canvas.width || 640;
        const canvasHeight = this.canvas.height || 480;
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;

        let closestDistance = Infinity;
        let closestIndex = 0;

        landmarksList.forEach((landmarks, index) => {
            const nose = landmarks[0];
            if (nose && nose.visibility > 0.5) {
                const landmarkX = nose.x * canvasWidth;
                const landmarkY = nose.y * canvasHeight;
                const distance = Math.sqrt(Math.pow(landmarkX - centerX, 2) + Math.pow(landmarkY - centerY, 2));
                
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestIndex = index;
                }
            }
        });

        this.mainPersonIndex = closestIndex;
        return landmarksList[closestIndex];
    }

    drawPose(landmarks) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const connections = [
            [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
            [11, 23], [12, 24], [23, 24], [23, 25], [24, 26],
            [25, 27], [26, 28], [27, 29], [28, 30], [29, 31], [30, 32],
            [15, 17], [15, 19], [15, 21], [16, 18], [16, 20], [16, 22]
        ];

        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;

        connections.forEach(([start, end]) => {
            const startPoint = landmarks[start];
            const endPoint = landmarks[end];

            if (startPoint && endPoint && startPoint.visibility > 0.5 && endPoint.visibility > 0.5) {
                ctx.beginPath();
                ctx.moveTo(startPoint.x * this.canvas.width, startPoint.y * this.canvas.height);
                ctx.lineTo(endPoint.x * this.canvas.width, endPoint.y * this.canvas.height);
                ctx.stroke();
            }
        });

        // 只绘制身体关键点（跳过头部关键点 0-10）
        const keyPoints = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
        ctx.fillStyle = '#ff0000';

        keyPoints.forEach(index => {
            const point = landmarks[index];
            if (point && point.visibility > 0.5) {
                ctx.beginPath();
                ctx.arc(
                    point.x * this.canvas.width,
                    point.y * this.canvas.height,
                    6,
                    0,
                    2 * Math.PI
                );
                ctx.fill();
            }
        });

        this.drawAngleAnnotations(landmarks);
        this.drawTrajectory();
    }

    calculateAngle(point1, point2, point3) {
        if (!point1 || !point2 || !point3) {
            return 0;
        }
        
        const radians = Math.atan2(point3.y - point2.y, point3.x - point2.x) -
                       Math.atan2(point1.y - point2.y, point1.x - point2.x);
        let angle = Math.abs(radians * 180 / Math.PI);
        if (angle > 180) angle = 360 - angle;
        return angle;
    }

    drawAngleAnnotations(landmarks) {
        const ctx = this.ctx;
        ctx.lineWidth = 2;

        const actionType = this.analysisResult?.actionType?.type || 'forehand';
        const actionData = this.standardActions[actionType];

        // 判断是否需要双手数据（如发球）
        const requireBothHands = actionData?.requireBothHands || false;

        // 根据持拍手选择使用的关节索引
        const isRightHanded = this.dominantHand === 'right';
        
        // 持拍手侧关节索引
        const dominantShoulderIdx = isRightHanded ? 12 : 11;
        const dominantElbowIdx = isRightHanded ? 14 : 13;
        const dominantWristIdx = isRightHanded ? 16 : 15;
        const dominantHandIdx = isRightHanded ? 18 : 17;
        const dominantHipIdx = isRightHanded ? 24 : 23;
        const dominantKneeIdx = isRightHanded ? 26 : 25;
        
        // 非持拍手侧关节索引
        const nonDominantShoulderIdx = isRightHanded ? 11 : 12;
        const nonDominantElbowIdx = isRightHanded ? 13 : 14;
        const nonDominantWristIdx = isRightHanded ? 15 : 16;
        const nonDominantHandIdx = isRightHanded ? 17 : 18;
        const nonDominantHipIdx = isRightHanded ? 23 : 24;
        const nonDominantKneeIdx = isRightHanded ? 25 : 26;

        // 已放置的卡片列表，用于检测重叠
        const placedCards = [];
        
        // 检查两个卡片是否重叠
        const checkOverlap = (x1, y1, w1, h1, x2, y2, w2, h2) => {
            return !(x1 + w1 < x2 || x2 + w2 < x1 || y1 + h1 < y2 || y2 + h2 < y1);
        };

        // 绘制引出卡片函数
        const drawAngleCard = (angle, jointX, jointY, label, color, standardRange = null, side = '') => {
            const isOutOfRange = standardRange && (angle < standardRange.min || angle > standardRange.max);
            
            // 动态计算卡片位置：根据关节位置向四周偏移
            const cardWidth = 100;
            const cardHeight = 50;
            
            // 根据关节位置智能选择卡片位置
            let cardX, cardY;
            
            // 判断关节在画布的大致位置
            const isLeftSide = jointX < this.canvas.width * 0.4;
            const isRightSide = jointX > this.canvas.width * 0.6;
            const isTopSide = jointY < this.canvas.height * 0.35;
            const isBottomSide = jointY > this.canvas.height * 0.65;
            
            // 持拍手侧卡片放在左侧，非持拍手侧放在右侧
            const isDominantSide = side === '持拍';
            
            // 预设多个候选位置
            const candidates = [];
            
            if (isDominantSide || side === '左') {
                // 持拍手侧/左腿：优先放在左侧
                candidates.push(
                    { x: Math.max(10, jointX - cardWidth - 25), y: Math.max(10, jointY - cardHeight - 20) },  // 左上
                    { x: Math.max(10, jointX - cardWidth - 25), y: Math.min(this.canvas.height - cardHeight - 10, jointY + 25) },  // 左下
                    { x: Math.max(10, jointX - cardWidth - 25), y: Math.max(10, Math.min(this.canvas.height - cardHeight - 10, jointY - cardHeight / 2)) }  // 左侧中
                );
            } else {
                // 非持拍手侧/右腿：优先放在右侧
                candidates.push(
                    { x: Math.min(this.canvas.width - cardWidth - 10, jointX + 25), y: Math.max(10, jointY - cardHeight - 20) },  // 右上
                    { x: Math.min(this.canvas.width - cardWidth - 10, jointX + 25), y: Math.min(this.canvas.height - cardHeight - 10, jointY + 25) },  // 右下
                    { x: Math.min(this.canvas.width - cardWidth - 10, jointX + 25), y: Math.max(10, Math.min(this.canvas.height - cardHeight - 10, jointY - cardHeight / 2)) }  // 右侧中
                );
            }
            
            // 选择最佳位置（避免重叠）
            let bestCandidate = candidates[0];
            let minDistance = Infinity;
            
            for (const candidate of candidates) {
                let hasOverlap = false;
                for (const placed of placedCards) {
                    if (checkOverlap(candidate.x, candidate.y, cardWidth, cardHeight, placed.x, placed.y, placed.width, placed.height)) {
                        hasOverlap = true;
                        break;
                    }
                }
                
                if (!hasOverlap) {
                    // 计算到关节的距离，选择最近的不重叠位置
                    const distance = Math.sqrt(Math.pow(candidate.x + cardWidth / 2 - jointX, 2) + Math.pow(candidate.y + cardHeight / 2 - jointY, 2));
                    if (distance < minDistance) {
                        minDistance = distance;
                        bestCandidate = candidate;
                    }
                }
            }
            
            cardX = bestCandidate.x;
            cardY = bestCandidate.y;
            
            // 记录已放置的卡片
            placedCards.push({ x: cardX, y: cardY, width: cardWidth, height: cardHeight });

            // 绘制引出线（使用折线避免交叉）
            ctx.beginPath();
            ctx.moveTo(jointX, jointY);
            
            // 计算中间点，使引线更平滑
            const midX = (jointX + cardX + cardWidth / 2) / 2;
            const midY = (jointY + cardY + cardHeight / 2) / 2;
            
            ctx.lineTo(midX, midY);
            ctx.lineTo(cardX + cardWidth / 2, cardY + cardHeight / 2);
            ctx.strokeStyle = isOutOfRange ? '#FF4444' : color;
            ctx.lineWidth = 2;
            ctx.stroke();

            // 绘制卡片背景
            ctx.fillStyle = isOutOfRange ? 'rgba(255, 68, 68, 0.95)' : 'rgba(255, 255, 255, 0.95)';
            ctx.strokeStyle = isOutOfRange ? '#FF4444' : color;
            ctx.lineWidth = isOutOfRange ? 2 : 1;
            ctx.beginPath();
            ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 6);
            ctx.fill();
            ctx.stroke();

            // 绘制关节名称（带侧别标识）
            const displayLabel = side ? `${label}(${side})` : label;
            ctx.font = 'bold 11px Arial';
            ctx.fillStyle = isOutOfRange ? '#FFFFFF' : '#333333';
            ctx.textAlign = 'left';
            ctx.fillText(displayLabel, cardX + 6, cardY + 16);

            // 绘制角度值
            ctx.font = 'bold 20px Arial';
            ctx.fillStyle = isOutOfRange ? '#FFFFFF' : color;
            ctx.textAlign = 'left';
            ctx.fillText(`${angle.toFixed(0)}°`, cardX + 6, cardY + 36);

            // 绘制标准范围
            if (standardRange) {
                ctx.font = '9px Arial';
                ctx.fillStyle = isOutOfRange ? '#FFDDDD' : '#666666';
                ctx.fillText(`标准: ${standardRange.min}-${standardRange.max}°`, cardX + 6, cardY + 47);
            }

            // 超出范围标记
            if (isOutOfRange) {
                ctx.font = 'bold 9px Arial';
                ctx.fillStyle = '#FFFFFF';
                const hint = angle < standardRange.min ? '偏小!' : '偏大!';
                ctx.textAlign = 'right';
                ctx.fillText(hint, cardX + cardWidth - 5, cardY + 16);
            }
        };

        // 绘制手臂关节角度（跟随持拍手侧）
        const drawArmAngles = (shoulderIdx, elbowIdx, wristIdx, handIdx, side) => {
            // 肘部角度
            if (landmarks[elbowIdx]?.visibility > 0.5 && landmarks[wristIdx]?.visibility > 0.5 && landmarks[shoulderIdx]?.visibility > 0.5) {
                const elbowAngle = this.calculateAngle(landmarks[shoulderIdx], landmarks[elbowIdx], landmarks[wristIdx]);
                drawAngleCard(elbowAngle,
                    landmarks[elbowIdx].x * this.canvas.width,
                    landmarks[elbowIdx].y * this.canvas.height,
                    '肘部', '#667eea', actionData?.elbowAngle, side);
            }

            // 肩部角度
            if (landmarks[elbowIdx]?.visibility > 0.5 && landmarks[shoulderIdx]?.visibility > 0.5 && landmarks[dominantHipIdx]?.visibility > 0.5) {
                const shoulderAngle = this.calculateAngle(landmarks[elbowIdx], landmarks[shoulderIdx], landmarks[dominantHipIdx]);
                drawAngleCard(shoulderAngle,
                    landmarks[shoulderIdx].x * this.canvas.width,
                    landmarks[shoulderIdx].y * this.canvas.height,
                    '肩部', '#ed8936', actionData?.shoulderAngle, side);
            }

            // 腕部角度
            if (landmarks[wristIdx]?.visibility > 0.5 && landmarks[handIdx]?.visibility > 0.5 && landmarks[elbowIdx]?.visibility > 0.5) {
                const wristAngle = this.calculateAngle(landmarks[elbowIdx], landmarks[wristIdx], landmarks[handIdx]);
                drawAngleCard(wristAngle,
                    landmarks[wristIdx].x * this.canvas.width,
                    landmarks[wristIdx].y * this.canvas.height,
                    '腕部', '#9370DB', actionData?.wristAngle, side);
            }
        };

        // 绘制腿部关节角度（总是显示左右两侧）
        const drawLegAngles = (hipIdx, kneeIdx, otherHipIdx, side) => {
            // 膝部角度
            if (landmarks[hipIdx]?.visibility > 0.5 && landmarks[kneeIdx]?.visibility > 0.5 && landmarks[otherHipIdx]?.visibility > 0.5) {
                const kneeAngle = this.calculateAngle(landmarks[otherHipIdx], landmarks[hipIdx], landmarks[kneeIdx]);
                drawAngleCard(kneeAngle,
                    landmarks[kneeIdx].x * this.canvas.width,
                    landmarks[kneeIdx].y * this.canvas.height,
                    '膝部', '#f56565', actionData?.kneeAngle, side);
            }

            // 髋部角度（使用膝盖位置代替肩膀位置来计算）
            if (landmarks[hipIdx]?.visibility > 0.5 && landmarks[otherHipIdx]?.visibility > 0.5 && landmarks[kneeIdx]?.visibility > 0.5) {
                const hipAngle = this.calculateAngle(landmarks[otherHipIdx], landmarks[hipIdx], landmarks[kneeIdx]);
                drawAngleCard(hipAngle,
                    landmarks[hipIdx].x * this.canvas.width,
                    landmarks[hipIdx].y * this.canvas.height,
                    '髋部', '#48bb78', actionData?.hipAngle, side);
            }
        };

        // 绘制手臂角度（持拍手侧）
        drawArmAngles(dominantShoulderIdx, dominantElbowIdx, dominantWristIdx, dominantHandIdx, '持拍');

        // 如果需要双手数据，绘制非持拍手手臂角度
        if (requireBothHands) {
            drawArmAngles(nonDominantShoulderIdx, nonDominantElbowIdx, nonDominantWristIdx, nonDominantHandIdx, '非持');
        }

        // 绘制腿部角度（左右两侧都显示）
        drawLegAngles(23, 25, 24, '左');  // 左腿
        drawLegAngles(24, 26, 23, '右');  // 右腿
    }

    drawDataPanel(landmarks) {
        const ctx = this.ctx;
        const panelWidth = 220;
        const panelHeight = 180;

        // 将面板固定在右上角，避免遮挡人物头部
        const panelX = this.canvas.width - panelWidth - 15;
        const panelY = 15;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 10);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('📊 实时数据', panelX + 12, panelY + 28);

        ctx.font = '14px Arial';
        ctx.fillStyle = '#E0E0E0';
        ctx.fillText('──────────────────────', panelX + 12, panelY + 45);

        let currentSpeed = 0;
        if (this.poseResults.length > 1) {
            const prev = this.poseResults[this.poseResults.length - 2].landmarks[15];
            const curr = landmarks[15];
            if (prev && curr && prev.visibility > 0.5 && curr.visibility > 0.5) {
                const dx = curr.x - prev.x;
                const dy = curr.y - prev.y;
                currentSpeed = Math.sqrt(dx * dx + dy * dy) * 100;
            }
        }

        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#00BFFF';
        ctx.fillText(`肘部: ${this.getAngleDisplay(landmarks, 11, 13, 15)}`, panelX + 12, panelY + 68);
        
        ctx.fillStyle = '#FF6B6B';
        ctx.fillText(`肩部: ${this.getAngleDisplay(landmarks, 13, 11, 23)}`, panelX + 12, panelY + 92);
        
        ctx.fillStyle = '#98D8C8';
        ctx.fillText(`髋部: ${this.getAngleDisplay(landmarks, 13, 23, 25)}`, panelX + 12, panelY + 116);
        
        ctx.fillStyle = '#FFE066';
        ctx.fillText(`膝部: ${this.getAngleDisplay(landmarks, 24, 23, 25)}`, panelX + 12, panelY + 140);
        
        ctx.fillStyle = '#A855F7';
        ctx.fillText(`速度: ${currentSpeed.toFixed(2)}`, panelX + 12, panelY + 164);
    }

    getAngleDisplay(landmarks, p1Idx, p2Idx, p3Idx) {
        const p1 = landmarks[p1Idx];
        const p2 = landmarks[p2Idx];
        const p3 = landmarks[p3Idx];
        
        if (p1.visibility < 0.5 || p2.visibility < 0.5 || p3.visibility < 0.5) {
            return '--°';
        }
        
        const angle = this.calculateAngle(p1, p2, p3);
        return `${angle.toFixed(0)}°`;
    }

    updateTrajectory(landmarks) {
        const wristPoint = landmarks[15];
        if (wristPoint && wristPoint.visibility > 0.5) {
            this.trajectory.push({
                x: wristPoint.x * this.canvas.width,
                y: wristPoint.y * this.canvas.height,
                frame: this.currentFrame
            });

            if (this.trajectory.length > 100) {
                this.trajectory.shift();
            }
        }
    }

    drawTrajectory() {
        if (this.trajectory.length < 2) return;

        const ctx = this.ctx;
        ctx.strokeStyle = 'rgba(0, 150, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        ctx.beginPath();
        ctx.moveTo(this.trajectory[0].x, this.trajectory[0].y);

        for (let i = 1; i < this.trajectory.length; i++) {
            ctx.lineTo(this.trajectory[i].x, this.trajectory[i].y);
        }

        ctx.stroke();
        ctx.setLineDash([]);
    }

    detectDominantHand() {
        if (this.poseResults.length < 2) {
            this.dominantHand = 'right';
            return;
        }

        let rightHandMovement = 0;
        let leftHandMovement = 0;
        let rightHandSpeed = 0;
        let leftHandSpeed = 0;
        let rightHandMaxY = -Infinity;
        let rightHandMinY = Infinity;
        let leftHandMaxY = -Infinity;
        let leftHandMinY = Infinity;

        for (let i = 1; i < this.poseResults.length; i++) {
            const prev = this.poseResults[i - 1].landmarks;
            const curr = this.poseResults[i].landmarks;

            // 右手腕 (landmark 15)
            if (prev[15] && curr[15] && prev[15].visibility > 0.5 && curr[15].visibility > 0.5) {
                const dx = curr[15].x - prev[15].x;
                const dy = curr[15].y - prev[15].y;
                const speed = Math.sqrt(dx * dx + dy * dy);
                rightHandMovement += Math.abs(dx) + Math.abs(dy);
                rightHandSpeed += speed;
                rightHandMaxY = Math.max(rightHandMaxY, curr[15].y);
                rightHandMinY = Math.min(rightHandMinY, curr[15].y);
            }

            // 左手腕 (landmark 16)
            if (prev[16] && curr[16] && prev[16].visibility > 0.5 && curr[16].visibility > 0.5) {
                const dx = curr[16].x - prev[16].x;
                const dy = curr[16].y - prev[16].y;
                const speed = Math.sqrt(dx * dx + dy * dy);
                leftHandMovement += Math.abs(dx) + Math.abs(dy);
                leftHandSpeed += speed;
                leftHandMaxY = Math.max(leftHandMaxY, curr[16].y);
                leftHandMinY = Math.min(leftHandMinY, curr[16].y);
            }
        }

        // 综合判断：运动幅度 + 速度 + 垂直位移
        const rightVerticalRange = rightHandMaxY - rightHandMinY;
        const leftVerticalRange = leftHandMaxY - leftHandMinY;

        // 右手权重 = 运动幅度 + 速度 + 垂直位移
        let rightScore = rightHandMovement * 1.5 + rightHandSpeed * 2 + rightVerticalRange;
        let leftScore = leftHandMovement * 1.5 + leftHandSpeed * 2 + leftVerticalRange;

        // 添加球拍位置判断（通常持拍手更靠近身体前方）
        let rightAvgX = 0, leftAvgX = 0, rightCount = 0, leftCount = 0;
        for (const frame of this.poseResults) {
            if (frame.landmarks[15]?.visibility > 0.5) {
                rightAvgX += frame.landmarks[15].x;
                rightCount++;
            }
            if (frame.landmarks[16]?.visibility > 0.5) {
                leftAvgX += frame.landmarks[16].x;
                leftCount++;
            }
        }
        rightAvgX = rightCount > 0 ? rightAvgX / rightCount : 0.5;
        leftAvgX = leftCount > 0 ? leftAvgX / leftCount : 0.5;

        // 在视频坐标系中，x=0是左侧，x=1是右侧
        // 如果人物面向镜头，持拍手（右手持拍者的右手）会更靠近画面中心或右侧
        // 正手动作时持拍手通常有更大的向前伸展
        if (rightAvgX > leftAvgX) {
            rightScore += 50;
        } else {
            leftScore += 50;
        }

        this.dominantHand = rightScore > leftScore ? 'right' : 'left';
        this.dominantHandScore = {
            right: rightScore,
            left: leftScore,
            ratio: rightScore / (rightScore + leftScore + 0.001)
        };
    }

    analyzeMotion() {
        if (this.poseResults.length === 0) {
            alert('没有检测到姿态数据');
            return;
        }

        // 自动检测持拍手
        this.detectDominantHand();
        console.log('检测到持拍手:', this.dominantHand);

        const selectedType = this.selectedActionType || 'forehand';
        const actionData = this.standardActions[selectedType];
        
        const actionType = {
            type: selectedType,
            name: actionData.name,
            nameEn: actionData.nameEn,
            score: 100
        };
        
        const scores = this.calculateScores(actionType);
        const issues = this.identifyIssues(actionType, scores);
        const suggestions = this.generateSuggestions(issues);

        this.analysisResult = {
            actionType,
            confidence: 100,
            scores,
            issues,
            suggestions,
            timestamp: new Date().toISOString(),
            cameraPosition: this.cameraPosition
        };

        this.displayResults();
    }

    identifyAction() {
        let bestMatch = 'forehand';
        let bestScore = 0;

        for (const [actionKey, actionData] of Object.entries(this.standardActions)) {
            const score = this.matchAction(actionData);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = actionKey;
            }
        }

        return {
            type: bestMatch,
            name: this.standardActions[bestMatch].name,
            nameEn: this.standardActions[bestMatch].nameEn,
            score: bestScore
        };
    }

    matchAction(actionData) {
        const avgAngles = this.calculateAverageAngles();
        const trajectoryFeatures = this.calculateTrajectoryFeatures();
        const motionDynamics = this.calculateMotionDynamics();

        let angleScore = 0;
        let angleCount = 0;

        const angleComparisons = [
            { actual: avgAngles.elbow, standard: actionData.elbowAngle },
            { actual: avgAngles.shoulder, standard: actionData.shoulderAngle },
            { actual: avgAngles.wrist, standard: actionData.wristAngle },
            { actual: avgAngles.hip, standard: actionData.hipAngle },
            { actual: avgAngles.knee, standard: actionData.kneeAngle }
        ];

        angleComparisons.forEach(({ actual, standard }) => {
            angleScore += this.calculateAngleScore(actual, standard);
            angleCount++;
        });
        angleScore = angleCount > 0 ? angleScore / angleCount : 0;

        let dynamicScore = this.matchDynamicFeatures(actionData, trajectoryFeatures, motionDynamics);

        const finalScore = angleScore * 0.6 + dynamicScore * 0.4;

        return finalScore;
    }

    calculateTrajectoryFeatures(results = null) {
        const poseResults = results || this.poseResults;
        
        if (poseResults.length < 2) {
            return {
                maxY: 0,
                minY: 0,
                avgY: 0,
                verticalRange: 0,
                horizontalRange: 0,
                direction: 'unknown'
            };
        }

        const isRightHanded = this.dominantHand === 'right';
        const wristIdx = isRightHanded ? 16 : 15;
        
        const trajectory = poseResults.map(frame => ({
            x: frame.landmarks[wristIdx]?.x || 0,
            y: frame.landmarks[wristIdx]?.y || 0
        }));

        const ys = trajectory.map(p => p.y);
        const xs = trajectory.map(p => p.x);
        
        const maxY = Math.max(...ys);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const minX = Math.min(...xs);
        
        const startY = ys[0];
        const endY = ys[ys.length - 1];
        
        let direction = 'unknown';
        if (endY < startY - 0.1) {
            direction = 'up';
        } else if (endY > startY + 0.1) {
            direction = 'down';
        } else {
            direction = 'horizontal';
        }

        return {
            maxY,
            minY,
            avgY: ys.reduce((a, b) => a + b, 0) / ys.length,
            verticalRange: maxY - minY,
            horizontalRange: maxX - minX,
            direction
        };
    }

    calculateMotionDynamics(results = null) {
        const poseResults = results || this.poseResults;
        
        if (poseResults.length < 2) {
            return {
                avgSpeed: 0,
                maxSpeed: 0,
                acceleration: 0,
                movementAmplitude: 0
            };
        }

        const actionFrames = this.getActionFrameIndices(poseResults);

        let totalSpeed = 0;
        let maxSpeed = 0;
        let movementAmplitude = 0;
        let count = 0;

        for (let i = 1; i < actionFrames.length; i++) {
            const prevIdx = actionFrames[i - 1];
            const currIdx = actionFrames[i];
            const prev = poseResults[prevIdx].landmarks[15];
            const curr = poseResults[currIdx].landmarks[15];
            
            if (prev && curr) {
                const dx = curr.x - prev.x;
                const dy = curr.y - prev.y;
                const speed = Math.sqrt(dx * dx + dy * dy);
                
                totalSpeed += speed;
                maxSpeed = Math.max(maxSpeed, speed);
                movementAmplitude += speed;
                count++;
            }
        }

        const avgSpeed = count > 0 ? totalSpeed / count : 0;
        const acceleration = count > 0 && maxSpeed > 0 ? maxSpeed / count : 0;
        
        return {
            avgSpeed,
            maxSpeed,
            acceleration,
            avgAcceleration: acceleration,
            movementAmplitude
        };
    }

    matchDynamicFeatures(actionData, trajectoryFeatures, motionDynamics) {
        let score = 0;
        let count = 0;

        if (!actionData.movement) {
            return 0.5;
        }

        const movement = actionData.movement;

        const directionMatch = trajectoryFeatures.direction === movement.direction ? 1.0 : 
                              Math.abs(trajectoryFeatures.direction - movement.direction) < 2 ? 0.6 : 0.2;
        score += directionMatch;
        count++;

        const verticalRange = trajectoryFeatures.verticalRange;
        const targetVertical = movement.verticalRange;
        const verticalScore = 1 - Math.abs(verticalRange - targetVertical) / Math.max(verticalRange, targetVertical, 50);
        score += Math.max(0, verticalScore);
        count++;

        const horizontalRange = trajectoryFeatures.horizontalRange;
        const targetHorizontal = movement.horizontalRange;
        const horizontalScore = 1 - Math.abs(horizontalRange - targetHorizontal) / Math.max(horizontalRange, targetHorizontal, 50);
        score += Math.max(0, horizontalScore);
        count++;

        const speed = motionDynamics.maxSpeed;
        let speedScore = 0.5;
        if (movement.speed === 'fast' && speed > 0.08) {
            speedScore = 1.0;
        } else if (movement.speed === 'fast' && speed > 0.05) {
            speedScore = 0.7;
        } else if (movement.speed === 'medium' && speed > 0.03 && speed < 0.1) {
            speedScore = 1.0;
        } else if (movement.speed === 'slow' && speed < 0.05) {
            speedScore = 1.0;
        } else if (movement.speed === 'slow' && speed < 0.08) {
            speedScore = 0.7;
        }
        score += speedScore;
        count++;

        const amplitudeScore = motionDynamics.movementAmplitude > 1.0 ? 0.8 : 0.4;
        score += amplitudeScore;
        count++;

        return count > 0 ? score / count : 0;
    }

    calculateAngleScore(actual, standard) {
        const min = standard.min;
        const max = standard.max;
        const range = max - min;

        if (actual >= min && actual <= max) {
            return 1.0;
        } else if (actual < min) {
            const deviation = min - actual;
            return Math.max(0, 1 - deviation / range);
        } else {
            const deviation = actual - max;
            return Math.max(0, 1 - deviation / range);
        }
    }

    getActionStartFrame() {
        if (this.poseResults.length < 10) {
            return 0;
        }

        const isRightHanded = this.dominantHand === 'right';
        const wristIdx = isRightHanded ? 16 : 15;
        
        let frameStart = 0;
        const threshold = 0.01;
        
        for (let i = 1; i < this.poseResults.length - 1; i++) {
            const prev = this.poseResults[i - 1].landmarks[wristIdx];
            const curr = this.poseResults[i].landmarks[wristIdx];
            const next = this.poseResults[i + 1].landmarks[wristIdx];
            
            if (prev && curr && next && 
                prev.visibility > 0.5 && curr.visibility > 0.5 && next.visibility > 0.5) {
                
                const speed1 = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));
                const speed2 = Math.sqrt(Math.pow(next.x - curr.x, 2) + Math.pow(next.y - curr.y, 2));
                
                if (speed1 > threshold && speed2 > threshold) {
                    frameStart = Math.max(0, i - 2);
                    break;
                }
            }
        }
        
        const maxSkip = Math.floor(this.poseResults.length * 0.2);
        return Math.min(frameStart, maxSkip);
    }

    getActionFrameIndices(results = null) {
        const poseResults = results || this.poseResults;
        
        if (poseResults.length < 5) {
            return Array.from({ length: poseResults.length }, (_, i) => i);
        }
        const isRightHanded = this.dominantHand === 'right';
        const wristIdx = isRightHanded ? 16 : 15;
        const threshold = 0.015;
        const minActionFrames = 15;
        const minActionIntensity = 3;
        
        const actionFrames = [];
        let inAction = false;
        let actionStart = 0;
        let intensityCount = 0;
        
        for (let i = 1; i < poseResults.length; i++) {
            const prev = poseResults[i - 1].landmarks[wristIdx];
            const curr = poseResults[i].landmarks[wristIdx];
            
            if (prev && curr && prev.visibility > 0.5 && curr.visibility > 0.5) {
                const speed = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));
                
                if (speed > threshold && !inAction) {
                    intensityCount++;
                    if (intensityCount >= minActionIntensity) {
                        inAction = true;
                        actionStart = Math.max(0, i - minActionIntensity);
                        intensityCount = 0;
                    }
                } else if (speed <= threshold && inAction) {
                    intensityCount++;
                    if (intensityCount >= minActionIntensity) {
                        inAction = false;
                        if (i - actionStart >= minActionFrames) {
                            for (let j = actionStart; j < i; j++) {
                                actionFrames.push(j);
                            }
                        }
                        actionStart = i;
                        intensityCount = 0;
                    }
                } else {
                    intensityCount = 0;
                }
            }
        }
        
        if (inAction && poseResults.length - actionStart >= minActionFrames) {
            for (let j = actionStart; j < poseResults.length; j++) {
                actionFrames.push(j);
            }
        }
        
        if (actionFrames.length === 0) {
            return Array.from({ length: poseResults.length }, (_, i) => i);
        }
        
        return actionFrames;
    }

    calculateAverageAngles(results = null) {
        const poseResults = results || this.poseResults;
        if (poseResults.length === 0) {
            return { elbow: 0, shoulder: 0, wrist: 0, hip: 0, knee: 0 };
        }

        const actionFrames = this.getActionFrameIndices(poseResults);

        let elbowSum = 0, shoulderSum = 0, wristSum = 0, hipSum = 0, kneeSum = 0;
        let count = 0;

        actionFrames.forEach(i => {
            const frame = poseResults[i];
            const angles = this.calculateFrameAngles(frame.landmarks);
            elbowSum += angles.elbow;
            shoulderSum += angles.shoulder;
            wristSum += angles.wrist;
            hipSum += angles.hip;
            kneeSum += angles.knee;
            count++;
        });

        return {
            elbow: count > 0 ? elbowSum / count : 0,
            shoulder: count > 0 ? shoulderSum / count : 0,
            wrist: count > 0 ? wristSum / count : 0,
            hip: count > 0 ? hipSum / count : 0,
            knee: count > 0 ? kneeSum / count : 0
        };
    }

    calculateFrameAngles(landmarks) {
        // 根据持拍手选择使用的关节索引
        const isRightHanded = this.dominantHand === 'right';
        const shoulderIdx = isRightHanded ? 12 : 11;
        const elbowIdx = isRightHanded ? 14 : 13;
        const wristIdx = isRightHanded ? 16 : 15;
        const hipIdx = isRightHanded ? 24 : 23;
        const kneeIdx = isRightHanded ? 26 : 25;
        const ankleIdx = isRightHanded ? 28 : 27;
        const otherHipIdx = isRightHanded ? 23 : 24;

        const shoulder = landmarks[shoulderIdx];
        const elbow = landmarks[elbowIdx];
        const wrist = landmarks[wristIdx];
        const hip = landmarks[hipIdx];
        const knee = landmarks[kneeIdx];
        const ankle = landmarks[ankleIdx];
        const otherHip = landmarks[otherHipIdx];

        const wristEndPoint = wrist ? { x: wrist.x, y: wrist.y - 0.1 } : null;
        
        return {
            elbow: shoulder && elbow && wrist ? this.calculateAngle(shoulder, elbow, wrist) : 0,
            shoulder: hip && shoulder && elbow ? this.calculateAngle(hip, shoulder, elbow) : 0,
            wrist: elbow && wrist && wristEndPoint ? this.calculateAngle(elbow, wrist, wristEndPoint) : 0,
            hip: otherHip && hip && knee ? this.calculateAngle(otherHip, hip, knee) : 0,
            knee: hip && knee && ankle ? this.calculateAngle(hip, knee, ankle) : 0
        };
    }

    calculateAngle(point1, point2, point3) {
        if (!point1 || !point2 || !point3) {
            return 0;
        }
        
        const vector1 = {
            x: point1.x - point2.x,
            y: point1.y - point2.y
        };

        const vector2 = {
            x: point3.x - point2.x,
            y: point3.y - point2.y
        };

        const dot = vector1.x * vector2.x + vector1.y * vector2.y;
        const mag1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
        const mag2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);

        if (mag1 === 0 || mag2 === 0) return 0;

        const cosAngle = dot / (mag1 * mag2);
        const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));

        return (angle * 180) / Math.PI;
    }

    calculateScores(actionType) {
        const avgAngles = this.calculateAverageAngles();
        const actionData = this.standardActions[actionType.type];

        const postureScore = this.calculatePostureScore(avgAngles, actionData);
        const continuityScore = this.calculateContinuityScore();
        const powerScore = this.calculatePowerScore(avgAngles, actionData);
        const completenessScore = this.calculateCompletenessScore();

        const totalScore = (
            postureScore * 0.4 +
            continuityScore * 0.3 +
            powerScore * 0.2 +
            completenessScore * 0.1
        );

        return {
            total: Math.round(totalScore * 10) / 10,
            posture: Math.round(postureScore * 10) / 10,
            continuity: Math.round(continuityScore * 10) / 10,
            power: Math.round(powerScore * 10) / 10,
            completeness: Math.round(completenessScore * 10) / 10
        };
    }

    calculateScoresForResults(results, actionType) {
        const avgAngles = this.calculateAverageAngles(results);
        const actionData = this.standardActions[actionType.type];

        const postureScore = this.calculatePostureScore(avgAngles, actionData);
        const continuityScore = this.calculateContinuityScore(results);
        const powerScore = this.calculatePowerScore(avgAngles, actionData, results);
        const completenessScore = this.calculateCompletenessScore(results);

        const totalScore = (
            postureScore * 0.4 +
            continuityScore * 0.3 +
            powerScore * 0.2 +
            completenessScore * 0.1
        );

        return {
            total: Math.round(totalScore * 10) / 10,
            posture: Math.round(postureScore * 10) / 10,
            continuity: Math.round(continuityScore * 10) / 10,
            power: Math.round(powerScore * 10) / 10,
            completeness: Math.round(completenessScore * 10) / 10
        };
    }

    calculatePostureScore(avgAngles, actionData) {
        const scores = [
            this.calculateAngleScore(avgAngles.elbow, actionData.elbowAngle),
            this.calculateAngleScore(avgAngles.shoulder, actionData.shoulderAngle),
            this.calculateAngleScore(avgAngles.wrist, actionData.wristAngle),
            this.calculateAngleScore(avgAngles.hip, actionData.hipAngle),
            this.calculateAngleScore(avgAngles.knee, actionData.kneeAngle)
        ];

        return scores.reduce((sum, score) => sum + score, 0) / scores.length * 100;
    }

    calculateContinuityScore(results = null) {
        const poseResults = results || this.poseResults;
        
        if (poseResults.length < 3) return 50;

        const actionFrames = this.getActionFrameIndices(poseResults);

        if (actionFrames.length < 3) return 50;

        let totalSmoothness = 0;
        let count = 0;

        for (let i = 2; i < actionFrames.length; i++) {
            const prevIdx = actionFrames[i - 2];
            const currIdx = actionFrames[i - 1];
            const nextIdx = actionFrames[i];
            const prev = poseResults[prevIdx].landmarks;
            const curr = poseResults[currIdx].landmarks;
            const next = poseResults[nextIdx].landmarks;

            if (prev[15] && curr[15] && next[15]) {
                const velocity1 = this.calculateDistance(prev[15], curr[15]);
                const velocity2 = this.calculateDistance(curr[15], next[15]);
                
                const acceleration = Math.abs(velocity2 - velocity1);
                const smoothness = Math.max(0, 1 - acceleration * 10);
                totalSmoothness += smoothness;
                count++;
            }
        }

        return count > 0 ? (totalSmoothness / count) * 100 : 50;
    }

    calculatePowerScore(avgAngles, actionData, results = null) {
        const elbowScore = this.calculateAngleScore(avgAngles.elbow, actionData.elbowAngle);
        const shoulderScore = this.calculateAngleScore(avgAngles.shoulder, actionData.shoulderAngle);
        const wristScore = this.calculateAngleScore(avgAngles.wrist, actionData.wristAngle);
        
        const motionDynamics = this.calculateMotionDynamics(results);
        const speedScore = Math.min(1, motionDynamics.avgSpeed * 50);
        
        const angleScore = (elbowScore + shoulderScore + wristScore) / 3;
        
        return ((angleScore * 0.6 + speedScore * 0.4) * 100);
    }

    calculateCompletenessScore(results = null) {
        const poseResults = results || this.poseResults;
        const actionType = this.analysisResult?.actionType?.type || 'forehand';
        const actionData = this.standardActions[actionType];
        
        if (!actionData || !poseResults.length) {
            return 50;
        }

        const expectedFrames = actionData.expectedFrames || 30;
        const frameRatio = Math.min(1, poseResults.length / expectedFrames);
        
        const avgAngles = this.calculateAverageAngles(poseResults);
        const trajectoryFeatures = this.calculateTrajectoryFeatures(poseResults);
        
        let motionScore = 0;
        const minMovement = actionData.movement?.minMovement || 0.1;
        if (trajectoryFeatures.verticalRange > minMovement || trajectoryFeatures.horizontalRange > minMovement) {
            motionScore = 1;
        } else {
            motionScore = Math.min(1, (trajectoryFeatures.verticalRange + trajectoryFeatures.horizontalRange) / (minMovement * 2));
        }

        return ((frameRatio * 0.6 + motionScore * 0.4) * 100);
    }

    calculateDistance(point1, point2) {
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    identifyIssues(actionType, scores) {
        const issues = [];
        const avgAngles = this.calculateAverageAngles();
        const actionData = this.standardActions[actionType.type];
        const jointNames = {
            elbow: '肘部',
            shoulder: '肩部',
            wrist: '腕部',
            hip: '髋部',
            knee: '膝盖'
        };

        if (scores.posture < 70) {
            const frame = this.findProblemFrame('posture');
            const problematicJoints = [];
            if (avgAngles.elbow < actionData.elbowAngle.min || avgAngles.elbow > actionData.elbowAngle.max) {
                problematicJoints.push(`肘部(${avgAngles.elbow.toFixed(0)}°，标准${actionData.elbowAngle.min}-${actionData.elbowAngle.max}°)`);
            }
            if (avgAngles.shoulder < actionData.shoulderAngle.min || avgAngles.shoulder > actionData.shoulderAngle.max) {
                problematicJoints.push(`肩部(${avgAngles.shoulder.toFixed(0)}°，标准${actionData.shoulderAngle.min}-${actionData.shoulderAngle.max}°)`);
            }
            if (avgAngles.wrist < actionData.wristAngle.min || avgAngles.wrist > actionData.wristAngle.max) {
                problematicJoints.push(`腕部(${avgAngles.wrist.toFixed(0)}°，标准${actionData.wristAngle.min}-${actionData.wristAngle.max}°)`);
            }
            
            issues.push({
                title: '姿态规范性不足',
                severity: 'high',
                description: `动作姿态与标准动作存在较大偏差。检测到以下关节角度异常：${problematicJoints.join('、')}。建议对照标准动作进行练习，重点关注这些关节的位置和角度。`,
                frame: frame,
                image: this.captureFrameAt(frame),
                joints: problematicJoints,
                suggestion: '请观看教学视频，对照标准动作进行分解练习，注意每个关节的位置'
            });
        }

        if (scores.continuity < 70) {
            const frame = this.findProblemFrame('continuity');
            const motionStats = this.calculateMotionDynamics();
            issues.push({
                title: '动作连贯性差',
                severity: 'medium',
                description: `动作过程中存在停顿或不流畅现象。平均运动速度：${motionStats.avgSpeed.toFixed(3)}，速度波动较大。动作连贯性是影响击球稳定性的重要因素。`,
                frame: frame,
                image: this.captureFrameAt(frame),
                metrics: { avgSpeed: motionStats.avgSpeed, maxSpeed: motionStats.maxSpeed },
                suggestion: '尝试放慢动作速度，分解练习每个环节，逐步提高动作的流畅度'
            });
        }

        if (scores.power < 70) {
            const frame = this.findProblemFrame('power');
            const motionStats = this.calculateMotionDynamics();
            issues.push({
                title: '发力不合理',
                severity: 'medium',
                description: `发力时机或发力方式需要改进。最大运动速度：${motionStats.maxSpeed.toFixed(3)}，加速度变化：${motionStats.avgAcceleration.toFixed(3)}。合理的发力应该是从腿到腰再到手臂的协调发力。`,
                frame: frame,
                image: this.captureFrameAt(frame),
                metrics: { maxSpeed: motionStats.maxSpeed, avgAcceleration: motionStats.avgAcceleration },
                suggestion: '注意发力顺序：腿部蹬地 -> 转腰 -> 大臂带动小臂 -> 手腕发力'
            });
        }

        if (avgAngles.elbow < actionData.elbowAngle.min - 10) {
            const frame = this.findProblemFrame('elbow');
            const diff = actionData.elbowAngle.min - avgAngles.elbow;
            issues.push({
                title: '肘部角度过小',
                severity: 'low',
                description: `肘部弯曲角度不足，当前约为${avgAngles.elbow.toFixed(1)}度，标准范围为${actionData.elbowAngle.min}-${actionData.elbowAngle.max}度，低于标准${diff.toFixed(1)}度。肘部角度偏小会影响发力效率。`,
                frame: frame,
                image: this.captureFrameAt(frame),
                joint: '肘部',
                currentAngle: avgAngles.elbow.toFixed(1),
                standardRange: `${actionData.elbowAngle.min}-${actionData.elbowAngle.max}度`,
                deviation: `${diff.toFixed(1)}度`,
                suggestion: `需要增加肘部弯曲角度${diff.toFixed(1)}度，保持约${actionData.elbowAngle.min}度以上的角度，有利于发力`
            });
        }

        if (avgAngles.shoulder < actionData.shoulderAngle.min - 10) {
            const frame = this.findProblemFrame('shoulder');
            const diff = actionData.shoulderAngle.min - avgAngles.shoulder;
            issues.push({
                title: '肩部活动范围不足',
                severity: 'low',
                description: `肩部转动幅度不够，当前约为${avgAngles.shoulder.toFixed(1)}度，标准范围为${actionData.shoulderAngle.min}-${actionData.shoulderAngle.max}度，低于标准${diff.toFixed(1)}度。肩部活动不足会影响动作完整性和发力效果。`,
                frame: frame,
                image: this.captureFrameAt(frame),
                joint: '肩部',
                currentAngle: avgAngles.shoulder.toFixed(1),
                standardRange: `${actionData.shoulderAngle.min}-${actionData.shoulderAngle.max}度`,
                deviation: `${diff.toFixed(1)}度`,
                suggestion: `需要增加肩部转动幅度${diff.toFixed(1)}度，练习时注意肩部放松，适当增大转动幅度`
            });
        }

        if (avgAngles.wrist < actionData.wristAngle.min - 10 || avgAngles.wrist > actionData.wristAngle.max + 10) {
            const frame = this.findProblemFrame('wrist');
            const diff = avgAngles.wrist < actionData.wristAngle.min 
                ? actionData.wristAngle.min - avgAngles.wrist 
                : avgAngles.wrist - actionData.wristAngle.max;
            const isLow = avgAngles.wrist < actionData.wristAngle.min;
            issues.push({
                title: isLow ? '腕部角度偏小' : '腕部角度偏大',
                severity: 'low',
                description: `腕部角度${isLow ? '偏小' : '偏大'}，当前约为${avgAngles.wrist.toFixed(1)}度，标准范围为${actionData.wristAngle.min}-${actionData.wristAngle.max}度，${isLow ? '低于' : '高于'}标准${diff.toFixed(1)}度。`,
                frame: frame,
                image: this.captureFrameAt(frame),
                joint: '腕部',
                currentAngle: avgAngles.wrist.toFixed(1),
                standardRange: `${actionData.wristAngle.min}-${actionData.wristAngle.max}度`,
                deviation: `${diff.toFixed(1)}度`,
                suggestion: `${isLow ? '适当增加' : '适当减小'}腕部弯曲角度，保持在标准范围内，有助于控制拍形和发力`
            });
        }

        if (avgAngles.hip < actionData.hipAngle.min - 10) {
            const frame = this.findProblemFrame('hip');
            const diff = actionData.hipAngle.min - avgAngles.hip;
            issues.push({
                title: '髋部转动不足',
                severity: 'low',
                description: `髋部转动幅度不够，当前约为${avgAngles.hip.toFixed(1)}度，标准范围为${actionData.hipAngle.min}-${actionData.hipAngle.max}度，低于标准${diff.toFixed(1)}度。髋部是发力的重要枢纽。`,
                frame: frame,
                image: this.captureFrameAt(frame),
                joint: '髋部',
                currentAngle: avgAngles.hip.toFixed(1),
                standardRange: `${actionData.hipAngle.min}-${actionData.hipAngle.max}度`,
                deviation: `${diff.toFixed(1)}度`,
                suggestion: `需要增加髋部转动幅度${diff.toFixed(1)}度，注意转腰发力的协调性`
            });
        }

        return issues.slice(0, 8);
    }

    findProblemFrame(type) {
        if (this.poseResults.length === 0) {
            return 0;
        }
        
        const actionType = this.analysisResult?.actionType?.type || 'forehand';
        const actionData = this.standardActions[actionType];
        const isRightHanded = this.dominantHand === 'right';
        
        const actionFrames = this.getActionFrameIndices();
        
        if (actionFrames.length === 0) {
            return 0;
        }
        
        let worstFrame = actionFrames[0];
        let maxDeviation = -1;
        
        for (let j = 0; j < actionFrames.length; j++) {
            const i = actionFrames[j];
            const result = this.poseResults[i];
            const landmarks = result.landmarks;
            let deviation = 0;
            
            switch (type) {
                case 'posture':
                    // 计算所有关键关节角度的综合偏差
                    if (landmarks[13]?.visibility > 0.5 && landmarks[11]?.visibility > 0.5 && landmarks[15]?.visibility > 0.5) {
                        const elbowAngle = this.calculateAngle(landmarks[11], landmarks[13], landmarks[15]);
                        deviation += Math.abs(elbowAngle - ((actionData?.elbowAngle?.min || 65) + (actionData?.elbowAngle?.max || 95)) / 2);
                    }
                    if (landmarks[11]?.visibility > 0.5 && landmarks[23]?.visibility > 0.5 && landmarks[13]?.visibility > 0.5) {
                        const shoulderAngle = this.calculateAngle(landmarks[13], landmarks[11], landmarks[23]);
                        deviation += Math.abs(shoulderAngle - ((actionData?.shoulderAngle?.min || 15) + (actionData?.shoulderAngle?.max || 40)) / 2);
                    }
                    break;
                    
                case 'power':
                    // 找出发力最大的帧（手腕速度最快）
                    if (j > 0) {
                        const prevIdx = actionFrames[j - 1];
                        const prev = this.poseResults[prevIdx].landmarks[isRightHanded ? 16 : 15];
                        const curr = landmarks[isRightHanded ? 16 : 15];
                        if (prev && curr && prev.visibility > 0.5 && curr.visibility > 0.5) {
                            const dx = curr.x - prev.x;
                            const dy = curr.y - prev.y;
                            deviation = Math.sqrt(dx * dx + dy * dy);
                        }
                    }
                    break;
                    
                case 'continuity':
                    // 找出动作不连贯的帧（速度变化大）
                    if (j > 1) {
                        const prevPrevIdx = actionFrames[j - 2];
                        const prevIdx = actionFrames[j - 1];
                        const prevPrev = this.poseResults[prevPrevIdx].landmarks[isRightHanded ? 16 : 15];
                        const prev = this.poseResults[prevIdx].landmarks[isRightHanded ? 16 : 15];
                        const curr = landmarks[isRightHanded ? 16 : 15];
                        if (prevPrev && prev && curr && 
                            prevPrev.visibility > 0.5 && prev.visibility > 0.5 && curr.visibility > 0.5) {
                            const speed1 = Math.sqrt(Math.pow(prev.x - prevPrev.x, 2) + Math.pow(prev.y - prevPrev.y, 2));
                            const speed2 = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));
                            deviation = Math.abs(speed2 - speed1);
                        }
                    }
                    break;
                    
                case 'elbow':
                    // 找出肘部角度偏差最大的帧
                    if (landmarks[13]?.visibility > 0.5 && landmarks[11]?.visibility > 0.5 && landmarks[15]?.visibility > 0.5) {
                        const elbowAngle = this.calculateAngle(landmarks[11], landmarks[13], landmarks[15]);
                        const targetAngle = ((actionData?.elbowAngle?.min || 65) + (actionData?.elbowAngle?.max || 95)) / 2;
                        deviation = Math.abs(elbowAngle - targetAngle);
                    }
                    break;
                    
                case 'shoulder':
                    // 找出肩部角度偏差最大的帧
                    if (landmarks[11]?.visibility > 0.5 && landmarks[23]?.visibility > 0.5 && landmarks[13]?.visibility > 0.5) {
                        const shoulderAngle = this.calculateAngle(landmarks[13], landmarks[11], landmarks[23]);
                        const targetAngle = ((actionData?.shoulderAngle?.min || 15) + (actionData?.shoulderAngle?.max || 40)) / 2;
                        deviation = Math.abs(shoulderAngle - targetAngle);
                    }
                    break;
                    
                case 'wrist':
                    // 找出腕部角度偏差最大的帧
                    const wristIdx = isRightHanded ? 16 : 15;
                    const handIdx = isRightHanded ? 18 : 17;
                    const elbowIdx = isRightHanded ? 14 : 13;
                    if (landmarks[wristIdx]?.visibility > 0.5 && landmarks[handIdx]?.visibility > 0.5 && landmarks[elbowIdx]?.visibility > 0.5) {
                        const wristAngle = this.calculateAngle(landmarks[elbowIdx], landmarks[wristIdx], landmarks[handIdx]);
                        const targetAngle = ((actionData?.wristAngle?.min || 140) + (actionData?.wristAngle?.max || 170)) / 2;
                        deviation = Math.abs(wristAngle - targetAngle);
                    }
                    break;
                    
                default:
                    // 默认返回中间帧
                    const middleIndex = Math.floor(this.poseResults.length / 2);
                    return this.poseResults[middleIndex]?.frame || 0;
            }
            
            if (deviation > maxDeviation) {
                maxDeviation = deviation;
                worstFrame = result.frame;
            }
        }
        
        return worstFrame;
    }

    generateSuggestions(issues) {
        const suggestions = [];

        issues.forEach(issue => {
            switch (issue.title) {
                case '姿态规范性不足':
                    suggestions.push('注意保持标准的基本站位，双脚分开与肩同宽，膝盖微屈，身体重心略微前倾');
                    break;
                case '动作连贯性差':
                    suggestions.push('练习动作的连贯性，避免在动作过程中出现停顿，保持流畅的动作节奏');
                    break;
                case '发力不合理':
                    suggestions.push('掌握正确的发力时机，在球拍接触球的瞬间发力，利用身体转动带动手臂');
                    break;
                case '肘部角度过小':
                    suggestions.push('适当增大肘部弯曲角度，保持大臂与身体夹角在合理范围内，便于发力');
                    break;
                case '肩部活动范围不足':
                    suggestions.push('增加肩部转动幅度，充分利用身体转动来增强击球力量');
                    break;
            }
        });

        if (suggestions.length === 0) {
            suggestions.push('动作整体表现良好，继续保持练习，注意细节的完善');
        }

        return [...new Set(suggestions)].slice(0, 5);
    }

    calculateConfidence() {
        if (this.poseResults.length === 0) return 0;

        let totalConfidence = 0;
        let count = 0;

        this.poseResults.forEach(frame => {
            frame.landmarks.forEach(landmark => {
                totalConfidence += landmark.visibility;
                count++;
            });
        });

        return count > 0 ? (totalConfidence / count * 100).toFixed(1) : 0;
    }

    displayResults() {
        if (!this.analysisResult) return;

        const { actionType, confidence, scores, issues, suggestions } = this.analysisResult;

        const actionSelect = document.getElementById('actionTypeSelect');
        actionSelect.value = actionType.type;
        
        document.getElementById('confidence').textContent = `${confidence}%`;

        document.getElementById('totalScore').textContent = scores.total;
        document.getElementById('scoreLevel').textContent = this.getScoreLevel(scores.total);
        
        const starCount = Math.round(scores.total / 20);
        document.getElementById('scoreStars').textContent = '★'.repeat(starCount) + '☆'.repeat(5 - starCount);

        this.updateScoreBar('posture', scores.posture);
        this.updateScoreBar('continuity', scores.continuity);
        this.updateScoreBar('power', scores.power);
        this.updateScoreBar('completeness', scores.completeness);

        this.displayStats();
        this.displayIssues(issues);
        this.displaySuggestions(suggestions);

        document.getElementById('exportBtn').disabled = false;
        document.getElementById('exportVideoBtn').disabled = false;
    }

    displayStats() {
        const avgAngles = this.calculateAverageAngles();
        const motionDynamics = this.calculateMotionDynamics();

        document.getElementById('frameCount').textContent = this.poseResults.length;
        document.getElementById('keyFrameCount').textContent = this.keyFrames.length;
        document.getElementById('avgElbowAngle').textContent = `${avgAngles.elbow.toFixed(1)}°`;
        document.getElementById('avgShoulderAngle').textContent = `${avgAngles.shoulder.toFixed(1)}°`;
        document.getElementById('avgSpeed').textContent = motionDynamics.avgSpeed.toFixed(3);
        document.getElementById('maxSpeed').textContent = motionDynamics.maxSpeed.toFixed(3);

        this.setupChartTabs();
        this.drawChart('elbow');
    }

    setupChartTabs() {
        const tabs = document.querySelectorAll('.chart-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                tabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                const chartType = e.target.dataset.chart;
                this.drawChart(chartType);
            });
        });
    }

    drawChart(type) {
        const canvas = document.getElementById('dataChart');
        const ctx = canvas.getContext('2d');
        const container = canvas.parentElement.parentElement; // chart-container
        
        // 根据缩放比例计算画布宽度
        const baseWidth = container.clientWidth - 40;
        const totalDataPoints = this.poseResults.length;
        const zoomedWidth = Math.max(baseWidth, totalDataPoints * 4 * this.chartZoom);
        
        canvas.width = zoomedWidth;
        canvas.height = 250;
        
        const width = canvas.width;
        const height = canvas.height;
        const padding = { top: 30, right: 20, bottom: 40, left: 50 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        ctx.clearRect(0, 0, width, height);

        const actionType = this.analysisResult?.actionType?.type || 'forehand';
        const actionData = this.standardActions[actionType];
        const isRightHanded = this.dominantHand === 'right';

        // 获取用户视频数据
        const userData = this.extractChartData(type, this.poseResults, isRightHanded, actionData);
        // 获取标准视频数据
        const standardData = this.hasStandardVideo && this.standardPoseResults.length > 0 
            ? this.extractChartData(type, this.standardPoseResults, isRightHanded, actionData) 
            : null;

        if (userData.length === 0) {
            ctx.font = '14px Arial';
            ctx.fillStyle = '#999';
            ctx.textAlign = 'center';
            ctx.fillText('暂无数据', width / 2, height / 2);
            return;
        }

        // 计算合并后的数据范围
        let allData = [...userData];
        if (standardData && standardData.length > 0) {
            allData = [...allData, ...standardData];
        }
        
        const minVal = Math.min(...allData) * 0.9;
        const maxVal = Math.max(...allData) * 1.1;
        const range = maxVal - minVal;

        // 绘制网格线
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding.top + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();

            const value = maxVal - (range / 5) * i;
            ctx.font = '10px Arial';
            ctx.fillStyle = '#718096';
            ctx.textAlign = 'right';
            ctx.fillText(value.toFixed(0), padding.left - 8, y + 4);
        }

        // 绘制Y轴
        ctx.strokeStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, height - padding.bottom);
        ctx.stroke();

        // Y轴标签
        const yLabel = type === 'speed' ? '速度' : '角度(°)';
        ctx.font = '10px Arial';
        ctx.fillStyle = '#718096';
        ctx.textAlign = 'center';
        ctx.save();
        ctx.translate(20, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(yLabel, 0, 0);
        ctx.restore();

        // 绘制标准范围（如果不是速度图）
        const standardRange = type !== 'speed' ? (actionData?.[`${type}Angle`] || null) : null;
        if (standardRange) {
            const y1 = padding.top + chartHeight * (1 - (standardRange.max - minVal) / range);
            const y2 = padding.top + chartHeight * (1 - (standardRange.min - minVal) / range);

            ctx.fillStyle = 'rgba(72, 187, 120, 0.2)';
            ctx.beginPath();
            ctx.rect(padding.left, Math.min(y1, y2), chartWidth, Math.abs(y2 - y1));
            ctx.fill();

            ctx.strokeStyle = 'rgba(72, 187, 120, 0.6)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(padding.left, y1);
            ctx.lineTo(width - padding.right, y1);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(padding.left, y2);
            ctx.lineTo(width - padding.right, y2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // 绘制用户视频曲线（蓝色）
        this.drawChartLine(ctx, userData, minVal, maxVal, range, padding, chartWidth, chartHeight, '#667eea', '用户');

        // 绘制标准视频曲线（红色）
        if (standardData && standardData.length > 0) {
            this.drawChartLine(ctx, standardData, minVal, maxVal, range, padding, chartWidth, chartHeight, '#fc8181', '标准');
        }

        // 更新图例
        this.updateChartLegend(standardData && standardData.length > 0);
        
        // 计算并显示统计值
        this.updateChartStats(userData, standardData);

        // 更新帧指示线
        this.updateFrameIndicator();
    }

    updateFrameIndicator() {
        const indicator = document.getElementById('frameIndicator');
        const canvas = document.getElementById('dataChart');
        const scrollWrapper = document.querySelector('.chart-scroll-wrapper');
        
        if (!indicator || !canvas || !scrollWrapper) return;

        const totalFrames = this.poseResults.length;
        if (totalFrames === 0) {
            indicator.classList.remove('active');
            return;
        }

        const currentTime = this.video?.currentTime || 0;
        const fps = this.fps || 30;
        const currentFrame = Math.floor(currentTime * fps);
        
        if (currentFrame >= 0 && currentFrame < totalFrames) {
            const canvasWidth = canvas.width;
            const chartWidth = canvasWidth - 70; // 减去padding
            const position = 50 + (currentFrame / totalFrames) * chartWidth; // 50是left padding
            
            indicator.style.left = `${position}px`;
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    }

    setupChartZoomControls() {
        const zoomInBtn = document.getElementById('zoomInBtn');
        const zoomOutBtn = document.getElementById('zoomOutBtn');
        const resetZoomBtn = document.getElementById('resetZoomBtn');
        const zoomLevel = document.getElementById('zoomLevel');

        zoomInBtn?.addEventListener('click', () => {
            this.chartZoom = Math.min(this.chartZoom + 0.25, 3);
            zoomLevel.textContent = `${Math.round(this.chartZoom * 100)}%`;
            this.redrawCurrentChart();
        });

        zoomOutBtn?.addEventListener('click', () => {
            this.chartZoom = Math.max(this.chartZoom - 0.25, 0.5);
            zoomLevel.textContent = `${Math.round(this.chartZoom * 100)}%`;
            this.redrawCurrentChart();
        });

        resetZoomBtn?.addEventListener('click', () => {
            this.chartZoom = 1;
            zoomLevel.textContent = '100%';
            this.redrawCurrentChart();
        });
    }

    redrawCurrentChart() {
        const activeTab = document.querySelector('.chart-tab.active');
        if (activeTab) {
            const chartType = activeTab.dataset.chart;
            this.drawChart(chartType);
        }
    }

    updateChartStats(userData, standardData) {
        // 计算用户视频统计值
        const userMean = userData.reduce((a, b) => a + b, 0) / userData.length;
        const userMax = Math.max(...userData);
        const userMin = Math.min(...userData);
        
        // 更新用户视频统计值显示
        document.getElementById('userMean').textContent = userMean.toFixed(1);
        document.getElementById('userMax').textContent = userMax.toFixed(1);
        document.getElementById('userMin').textContent = userMin.toFixed(1);
        
        // 更新标准视频统计值显示
        const standardStatsDiv = document.getElementById('standardStats');
        if (standardData && standardData.length > 0) {
            const standardMean = standardData.reduce((a, b) => a + b, 0) / standardData.length;
            const standardMax = Math.max(...standardData);
            const standardMin = Math.min(...standardData);
            
            document.getElementById('standardMean').textContent = standardMean.toFixed(1);
            document.getElementById('standardMax').textContent = standardMax.toFixed(1);
            document.getElementById('standardMin').textContent = standardMin.toFixed(1);
            
            standardStatsDiv.style.display = 'flex';
        } else {
            standardStatsDiv.style.display = 'none';
        }
    }

    extractChartData(type, poseResults, isRightHanded, actionData) {
        if (!poseResults || poseResults.length === 0) return [];

        let data = [];

        switch (type) {
            case 'elbow':
                data = poseResults.map(result => {
                    const landmarks = result.landmarks;
                    const elbowIdx = isRightHanded ? 14 : 13;
                    const shoulderIdx = isRightHanded ? 12 : 11;
                    const wristIdx = isRightHanded ? 16 : 15;
                    if (landmarks[elbowIdx]?.visibility > 0.5 && 
                        landmarks[shoulderIdx]?.visibility > 0.5 && 
                        landmarks[wristIdx]?.visibility > 0.5) {
                        return this.calculateAngle(landmarks[shoulderIdx], landmarks[elbowIdx], landmarks[wristIdx]);
                    }
                    return null;
                }).filter(v => v !== null);
                break;
                
            case 'shoulder':
                data = poseResults.map(result => {
                    const landmarks = result.landmarks;
                    const shoulderIdx = isRightHanded ? 12 : 11;
                    const elbowIdx = isRightHanded ? 14 : 13;
                    const hipIdx = isRightHanded ? 24 : 23;
                    if (landmarks[shoulderIdx]?.visibility > 0.5 && 
                        landmarks[elbowIdx]?.visibility > 0.5 && 
                        landmarks[hipIdx]?.visibility > 0.5) {
                        return this.calculateAngle(landmarks[elbowIdx], landmarks[shoulderIdx], landmarks[hipIdx]);
                    }
                    return null;
                }).filter(v => v !== null);
                break;
                
            case 'wrist':
                data = poseResults.map(result => {
                    const landmarks = result.landmarks;
                    const wristIdx = isRightHanded ? 16 : 15;
                    const handIdx = isRightHanded ? 18 : 17;
                    const elbowIdx = isRightHanded ? 14 : 13;
                    if (landmarks[wristIdx]?.visibility > 0.5 && 
                        landmarks[handIdx]?.visibility > 0.5 && 
                        landmarks[elbowIdx]?.visibility > 0.5) {
                        return this.calculateAngle(landmarks[elbowIdx], landmarks[wristIdx], landmarks[handIdx]);
                    }
                    return null;
                }).filter(v => v !== null);
                break;
                
            case 'hip':
                data = poseResults.map(result => {
                    const landmarks = result.landmarks;
                    const hipIdx = isRightHanded ? 24 : 23;
                    const otherHipIdx = isRightHanded ? 23 : 24;
                    const kneeIdx = isRightHanded ? 26 : 25;
                    if (landmarks[hipIdx]?.visibility > 0.5 && 
                        landmarks[otherHipIdx]?.visibility > 0.5 && 
                        landmarks[kneeIdx]?.visibility > 0.5) {
                        return this.calculateAngle(landmarks[otherHipIdx], landmarks[hipIdx], landmarks[kneeIdx]);
                    }
                    return null;
                }).filter(v => v !== null);
                break;
                
            case 'knee':
                data = poseResults.map(result => {
                    const landmarks = result.landmarks;
                    const kneeIdx = isRightHanded ? 26 : 25;
                    const hipIdx = isRightHanded ? 24 : 23;
                    const ankleIdx = isRightHanded ? 28 : 27;
                    if (landmarks[kneeIdx]?.visibility > 0.5 && 
                        landmarks[hipIdx]?.visibility > 0.5 && 
                        landmarks[ankleIdx]?.visibility > 0.5) {
                        return this.calculateAngle(landmarks[hipIdx], landmarks[kneeIdx], landmarks[ankleIdx]);
                    }
                    return null;
                }).filter(v => v !== null);
                break;
                
            case 'speed':
                for (let i = 1; i < poseResults.length; i++) {
                    const prev = poseResults[i - 1].landmarks[isRightHanded ? 16 : 15];
                    const curr = poseResults[i].landmarks[isRightHanded ? 16 : 15];
                    if (prev && curr && prev.visibility > 0.5 && curr.visibility > 0.5) {
                        const dx = curr.x - prev.x;
                        const dy = curr.y - prev.y;
                        data.push(Math.sqrt(dx * dx + dy * dy) * 100);
                    } else {
                        data.push(null);
                    }
                }
                data = data.filter(v => v !== null);
                break;
        }

        return data;
    }

    drawChartLine(ctx, data, minVal, maxVal, range, padding, chartWidth, chartHeight, color, label) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        data.forEach((value, index) => {
            const x = padding.left + (chartWidth / (data.length - 1)) * index;
            const y = padding.top + chartHeight * (1 - (value - minVal) / range);
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        // 绘制数据点
        ctx.fillStyle = color;
        data.forEach((value, index) => {
            const x = padding.left + (chartWidth / (data.length - 1)) * index;
            const y = padding.top + chartHeight * (1 - (value - minVal) / range);
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    updateChartLegend(showStandard) {
        const legendContainer = document.querySelector('.chart-legend');
        if (!legendContainer) return;

        let legendHTML = `
            <div class="legend-item">
                <span class="legend-color" style="background: #667eea;"></span>
                <span>用户视频</span>
            </div>
        `;

        if (showStandard) {
            legendHTML += `
                <div class="legend-item">
                    <span class="legend-color" style="background: #fc8181;"></span>
                    <span>标准视频</span>
                </div>
            `;
        } else {
            legendHTML += `
                <div class="legend-item">
                    <span class="legend-color" style="background: #48bb78; opacity: 0.5;"></span>
                    <span>标准范围</span>
                </div>
            `;
        }

        legendContainer.innerHTML = legendHTML;
    }

    getScoreLevel(score) {
        if (score >= 90) return '优秀';
        if (score >= 80) return '良好';
        if (score >= 70) return '中等';
        if (score >= 60) return '及格';
        return '需改进';
    }

    updateScoreBar(type, score) {
        document.getElementById(`${type}Score`).style.width = `${score}%`;
        document.getElementById(`${type}Value`).textContent = score.toFixed(1);
    }

    displayIssues(issues) {
        const container = document.getElementById('issuesList');
        
        if (issues.length === 0) {
            container.innerHTML = `
                <div class="no-issues">
                    <p>未发现明显问题</p>
                    <p class="issue-frame-info">您的动作表现良好，继续保持！</p>
                </div>
            `;
            return;
        }

        container.innerHTML = issues.map((issue, index) => `
            <div class="issue-item">
                <div class="issue-title">
                    <span class="issue-number">${index + 1}.</span>
                    ${issue.title}
                    <span class="issue-severity severity-${issue.severity}">
                        ${this.getSeverityText(issue.severity)}
                    </span>
                </div>
                ${issue.image ? `
                    <div class="issue-image-container">
                        <img src="${issue.image}" class="issue-image" alt="问题截图" 
                             onclick="openImageModal('${issue.image}', '${issue.title} - 第${issue.frame}帧')">
                        <span class="image-hint">点击图片放大查看</span>
                    </div>
                ` : ''}
                <div class="issue-description">${issue.description}</div>
                <div class="issue-frame-info">问题帧: ${issue.frame} (${(issue.frame / this.fps).toFixed(1)}秒)</div>
                ${issue.suggestion ? `<div class="issue-suggestion">💡 ${issue.suggestion}</div>` : ''}
            </div>
        `).join('');
    }

    getSeverityText(severity) {
        const texts = {
            high: '严重',
            medium: '中等',
            low: '轻微'
        };
        return texts[severity] || severity;
    }

    displaySuggestions(suggestions) {
        const container = document.getElementById('suggestionsList');
        
        if (suggestions.length === 0) {
            container.innerHTML = '<p class="no-suggestions">暂无建议</p>';
            return;
        }

        container.innerHTML = suggestions.map(suggestion => `
            <div class="suggestion-item">
                <div class="suggestion-text">${suggestion}</div>
            </div>
        `).join('');
    }

    resetAnalysis() {
        const actionSelect = document.getElementById('actionTypeSelect');
        if (actionSelect) {
            actionSelect.value = '';
        }
        
        document.getElementById('confidence').textContent = '--';
        document.getElementById('totalScore').textContent = '--';
        document.getElementById('scoreLevel').textContent = '--';

        ['posture', 'continuity', 'power', 'completeness'].forEach(type => {
            document.getElementById(`${type}Score`).style.width = '0%';
            document.getElementById(`${type}Value`).textContent = '--';
        });

        document.getElementById('issuesList').innerHTML = '<div class="no-issues"><p>暂无分析结果</p></div>';
        document.getElementById('suggestionsList').innerHTML = '<p class="no-suggestions">暂无建议</p>';

        document.getElementById('exportBtn').disabled = true;
        document.getElementById('exportVideoBtn').disabled = true;
    }

    enableControls() {
        const controls = [
            'playPauseBtn', 'progressBar', 'muteBtn', 'volumeBar',
            'prevFrameBtn', 'nextFrameBtn', 'captureFrameBtn', 'markKeyFrameBtn'
        ];

        controls.forEach(id => {
            document.getElementById(id).disabled = false;
        });
        
        this.checkAnalysisReady();
    }

    togglePlayPause() {
        if (this.video.paused) {
            this.video.play();
            document.getElementById('playPauseBtn').innerHTML = '<span class="icon-pause">⏸</span>';
        } else {
            this.video.pause();
            document.getElementById('playPauseBtn').innerHTML = '<span class="icon-play">▶</span>';
        }
    }

    updateProgress() {
        const progress = (this.video.currentTime / this.video.duration) * 100;
        document.getElementById('progressBar').value = progress;
        document.getElementById('currentTime').textContent = this.formatTime(this.video.currentTime);
        
        // 更新图表帧指示线
        this.updateFrameIndicator();
        
        if (this.analysisResult && this.poseResults.length > 0) {
            const fps = this.fps || 30;
            const currentFrame = Math.round(this.video.currentTime * fps);
            const poseResult = this.poseResults.find(r => r.frame === currentFrame) || 
                              this.poseResults[Math.min(currentFrame, this.poseResults.length - 1)];
            
            if (poseResult) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.drawPose(poseResult.landmarks);
                this.drawAngleAnnotations(poseResult.landmarks);
                this.drawTrajectory();
            }
        }
    }

    updateDuration() {
        document.getElementById('duration').textContent = this.formatTime(this.video.duration);
    }

    seekTo(value) {
        const time = (value / 100) * this.video.duration;
        this.video.currentTime = time;
    }

    toggleMute() {
        this.video.muted = !this.video.muted;
        document.getElementById('muteBtn').textContent = this.video.muted ? '🔇' : '🔊';
    }

    setVolume(value) {
        this.video.volume = value / 100;
    }

    setPlaybackSpeed(value) {
        this.video.playbackRate = parseFloat(value);
    }

    previousFrame() {
        const newTime = Math.max(0, this.video.currentTime - 1 / this.fps);
        this.video.currentTime = newTime;
    }

    nextFrame() {
        const newTime = Math.min(this.video.duration, this.video.currentTime + 1 / this.fps);
        this.video.currentTime = newTime;
    }

    captureFrame() {
        const canvas = document.createElement('canvas');
        canvas.width = this.video.videoWidth;
        canvas.height = this.video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(this.video, 0, 0);
        
        if (this.ctx) {
            ctx.drawImage(this.canvas, 0, 0);
        }

        const link = document.createElement('a');
        link.download = `frame_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    captureFrameData() {
        const canvas = document.createElement('canvas');
        canvas.width = this.video.videoWidth;
        canvas.height = this.video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(this.video, 0, 0);
        return canvas.toDataURL('image/jpeg', 0.8);
    }

    captureFrameAt(frameIndex) {
        if (!this.video || frameIndex === undefined || frameIndex === null) {
            return null;
        }
        
        const originalTime = this.video.currentTime;
        const time = frameIndex / this.fps;
        
        this.video.currentTime = time;
        
        const canvas = document.createElement('canvas');
        const width = Math.min(320, this.video.videoWidth);
        const height = Math.min(240, this.video.videoHeight);
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(this.video, 0, 0, width, height);
        
        this.video.currentTime = originalTime;
        
        return canvas.toDataURL('image/jpeg', 0.7);
    }

    markKeyFrame() {
        const frameData = {
            frame: this.currentFrame,
            timestamp: this.video.currentTime,
            image: this.captureFrameData()
        };
        
        this.keyFrames.push(frameData);
        alert(`已标记关键帧 ${this.keyFrames.length}`);
    }

    exportReport() {
        this.exportPDF();
    }

    exportPDF() {
        if (!this.analysisResult) {
            alert('请先进行动作分析');
            return;
        }

        const reportContent = this.generateReportContent();
        const blob = new Blob([reportContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `table_tennis_analysis_report_${Date.now()}.html`;
        link.click();
        URL.revokeObjectURL(url);
    }

    exportText() {
        if (!this.analysisResult) {
            alert('请先进行动作分析');
            return;
        }

        const reportContent = this.generateReportContent();
        const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.download = `table_tennis_analysis_${Date.now()}.txt`;
        link.href = URL.createObjectURL(blob);
        link.click();
    }

    exportAnalysisVideo() {
        if (!this.analysisResult || !this.poseResults.length) {
            alert('请先进行动作分析');
            return;
        }

        alert('开始导出分析视频...\n\n视频导出需要一些时间，请耐心等待。');

        const video = document.getElementById('videoPlayer');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = this.canvas.width;
        canvas.height = this.canvas.height;

        const fps = this.fps || 30;
        const totalFrames = this.poseResults.length;
        
        let currentFrame = 0;
        let summaryFrameCount = 0;
        const summaryDuration = 5 * fps;
        const chunks = [];
        
        const videoStream = canvas.captureStream(fps);
        const mediaRecorder = new MediaRecorder(videoStream, {
            mimeType: 'video/mp4; codecs=avc1',
            videoBitsPerSecond: 2500000
        });

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/mp4' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `table_tennis_analysis_${Date.now()}.mp4`;
            link.click();
            URL.revokeObjectURL(url);
            alert('视频导出完成！');
        };

        mediaRecorder.start();

        const exportFrame = async () => {
            if (currentFrame >= totalFrames) {
                mediaRecorder.stop();
                return;
            }

            const poseResult = this.poseResults[currentFrame];
            
            const frameTime = poseResult.timestamp || (poseResult.frame / fps);
            video.currentTime = frameTime;
            
            await new Promise(resolve => {
                const onSeeked = () => {
                    video.removeEventListener('seeked', onSeeked);
                    resolve();
                };
                video.addEventListener('seeked', onSeeked);
            });
            
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            this.drawSkeletonOnCanvas(ctx, poseResult.landmarks);
            this.drawAngleAnnotationsOnCanvas(ctx, poseResult.landmarks);
            this.drawTrajectoryOnCanvas(ctx);

            currentFrame++;
            setTimeout(exportFrame, 1000 / fps);
        };

        exportFrame();
    }

    drawSummaryPage(ctx, width, height, progress) {
        ctx.fillStyle = '#0a0a2e';
        ctx.fillRect(0, 0, width, height);

        const fadeIn = Math.min(1, progress * 3);
        ctx.globalAlpha = fadeIn;

        const actionType = this.analysisResult?.actionType?.type || 'forehand';
        const actionData = this.standardActions[actionType];

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('📊 动作分析报告', width / 2, 60);

        ctx.font = '20px Arial';
        ctx.fillStyle = '#a0a0c0';
        ctx.fillText(`动作类型: ${actionData?.name || '正手击球'}`, width / 2, 95);

        const avgAngles = this.calculateAverageAngles();
        const motionDynamics = this.calculateMotionDynamics();
        const issues = this.issues || [];
        const suggestions = this.suggestions || [];

        const leftCol = 60;
        const rightCol = width / 2 + 40;
        const startY = 150;
        const rowHeight = 45;

        ctx.fillStyle = '#667eea';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('📈 数据统计', leftCol, startY);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '14px Arial';
        const stats = [
            `分析帧数: ${this.poseResults.length}`,
            `关键帧数: ${this.keyFrames.length}`,
            `平均肘部角度: ${avgAngles.elbow.toFixed(1)}°`,
            `平均肩部角度: ${avgAngles.shoulder.toFixed(1)}°`,
            `平均腕部角度: ${avgAngles.wrist.toFixed(1)}°`,
            `平均髋部角度: ${avgAngles.hip.toFixed(1)}°`,
            `平均膝部角度: ${avgAngles.knee.toFixed(1)}°`,
            `平均运动速度: ${motionDynamics.avgSpeed.toFixed(3)}`,
            `最大运动速度: ${motionDynamics.maxSpeed.toFixed(3)}`
        ];

        stats.forEach((stat, i) => {
            ctx.fillText(stat, leftCol, startY + 35 + i * 30);
        });

        const chartX = rightCol;
        const chartY = startY;
        const chartWidth = width / 2 - 80;
        const chartHeight = 220;

        this.drawMiniChart(ctx, chartX, chartY, chartWidth, chartHeight);

        const issueY = startY + 320;
        ctx.fillStyle = '#f56565';
        ctx.font = 'bold 22px Arial';
        ctx.fillText('⚠️ 问题诊断', leftCol, issueY);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '14px Arial';
        
        if (issues.length > 0) {
            issues.slice(0, 3).forEach((issue, i) => {
                ctx.fillText(`• ${issue.type}: ${issue.description}`, leftCol, issueY + 35 + i * 30);
            });
        } else {
            ctx.fillStyle = '#48bb78';
            ctx.fillText('✓ 未发现明显问题', leftCol, issueY + 35);
        }

        const suggestY = issueY + 140;
        ctx.fillStyle = '#48bb78';
        ctx.font = 'bold 22px Arial';
        ctx.fillText('💡 修正建议', rightCol, suggestY);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '14px Arial';
        
        if (suggestions.length > 0) {
            suggestions.slice(0, 3).forEach((suggestion, i) => {
                const lines = this.wrapText(ctx, suggestion, chartWidth);
                lines.forEach((line, j) => {
                    ctx.fillText(line, rightCol, suggestY + 30 + i * 40 + j * 18);
                });
            });
        } else {
            ctx.fillStyle = '#48bb78';
            ctx.fillText('✓ 动作表现良好', rightCol, suggestY + 30);
        }

        ctx.fillStyle = '#667eea';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('—— 分析完成 ——', width / 2, height - 40);

        ctx.globalAlpha = 1;
    }

    drawMiniChart(ctx, x, y, width, height) {
        const padding = { top: 20, right: 20, bottom: 30, left: 45 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        ctx.fillStyle = 'rgba(102, 126, 234, 0.1)';
        ctx.fillRect(x, y, width, height);

        ctx.strokeStyle = 'rgba(102, 126, 234, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const lineY = y + padding.top + (chartHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(x + padding.left, lineY);
            ctx.lineTo(x + width - padding.right, lineY);
            ctx.stroke();
        }

        const actionType = this.analysisResult?.actionType?.type || 'forehand';
        const actionData = this.standardActions[actionType];
        const isRightHanded = this.dominantHand === 'right';

        const data = this.poseResults.map(result => {
            const landmarks = result.landmarks;
            const elbowIdx = isRightHanded ? 14 : 13;
            const shoulderIdx = isRightHanded ? 12 : 11;
            const wristIdx = isRightHanded ? 16 : 15;
            if (landmarks[elbowIdx]?.visibility > 0.5 && 
                landmarks[shoulderIdx]?.visibility > 0.5 && 
                landmarks[wristIdx]?.visibility > 0.5) {
                return this.calculateAngle(landmarks[shoulderIdx], landmarks[elbowIdx], landmarks[wristIdx]);
            }
            return null;
        }).filter(v => v !== null);

        if (data.length === 0) {
            ctx.fillStyle = '#666';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('暂无数据', x + width / 2, y + height / 2);
            return;
        }

        const minVal = Math.min(...data) * 0.9;
        const maxVal = Math.max(...data) * 1.1;

        ctx.strokeStyle = '#48bb78';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        const standardMax = actionData?.elbowAngle?.max || 95;
        const standardMin = actionData?.elbowAngle?.min || 65;
        const y1 = y + padding.top + chartHeight * (1 - (standardMax - minVal) / (maxVal - minVal));
        ctx.beginPath();
        ctx.moveTo(x + padding.left, y1);
        ctx.lineTo(x + width - padding.right, y1);
        ctx.stroke();
        const y2 = y + padding.top + chartHeight * (1 - (standardMin - minVal) / (maxVal - minVal));
        ctx.beginPath();
        ctx.moveTo(x + padding.left, y2);
        ctx.lineTo(x + width - padding.right, y2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2;
        ctx.beginPath();
        data.forEach((value, index) => {
            const px = x + padding.left + (chartWidth / (data.length - 1)) * index;
            const py = y + padding.top + chartHeight * (1 - (value - minVal) / (maxVal - minVal));
            if (index === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        });
        ctx.stroke();

        ctx.fillStyle = '#718096';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(maxVal.toFixed(0), x + padding.left - 8, y + padding.top + 12);
        ctx.fillText(minVal.toFixed(0), x + padding.left - 8, y + height - padding.bottom);

        ctx.fillStyle = '#a0a0c0';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('肘部角度变化曲线', x + width / 2, y + height - 5);
    }

    wrapText(ctx, text, maxWidth) {
        const words = text.split('');
        const lines = [];
        let currentLine = '';

        for (const char of text) {
            const testLine = currentLine + char;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = char;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) {
            lines.push(currentLine);
        }
        return lines;
    }

    drawSkeletonOnCanvas(ctx, landmarks) {
        const connections = [
            [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
            [11, 23], [12, 24], [23, 24], [23, 25], [24, 26],
            [25, 27], [26, 28], [27, 29], [28, 30], [29, 31], [30, 32],
            [15, 17], [15, 19], [15, 21], [16, 18], [16, 20], [16, 22]
        ];

        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;

        connections.forEach(([start, end]) => {
            const startPoint = landmarks[start];
            const endPoint = landmarks[end];

            if (startPoint?.visibility > 0.5 && endPoint?.visibility > 0.5) {
                ctx.beginPath();
                ctx.moveTo(startPoint.x * this.canvas.width, startPoint.y * this.canvas.height);
                ctx.lineTo(endPoint.x * this.canvas.width, endPoint.y * this.canvas.height);
                ctx.stroke();
            }
        });

        ctx.fillStyle = '#00ff00';
        landmarks.forEach((landmark, index) => {
            // 跳过头部关键点（索引0-9是头部相关点：鼻子、眼睛、耳朵等）
            if (index < 11) return;
            
            if (landmark?.visibility > 0.5) {
                ctx.beginPath();
                ctx.arc(landmark.x * this.canvas.width, landmark.y * this.canvas.height, 5, 0, 2 * Math.PI);
                ctx.fill();
            }
        });
    }

    drawAngleAnnotationsOnCanvas(ctx, landmarks) {
        ctx.lineWidth = 2;

        const actionType = this.analysisResult?.actionType?.type || 'forehand';
        const actionData = this.standardActions[actionType];

        const requireBothHands = actionData?.requireBothHands || false;
        const isRightHanded = this.dominantHand === 'right';
        
        const dominantShoulderIdx = isRightHanded ? 12 : 11;
        const dominantElbowIdx = isRightHanded ? 14 : 13;
        const dominantWristIdx = isRightHanded ? 16 : 15;
        const dominantHandIdx = isRightHanded ? 18 : 17;
        const dominantHipIdx = isRightHanded ? 24 : 23;
        const dominantKneeIdx = isRightHanded ? 26 : 25;
        
        const nonDominantShoulderIdx = isRightHanded ? 11 : 12;
        const nonDominantElbowIdx = isRightHanded ? 13 : 14;
        const nonDominantWristIdx = isRightHanded ? 15 : 16;
        const nonDominantHandIdx = isRightHanded ? 17 : 18;
        const nonDominantHipIdx = isRightHanded ? 23 : 24;
        const nonDominantKneeIdx = isRightHanded ? 25 : 26;

        // 已放置的卡片列表，用于检测重叠
        const placedCards = [];
        
        // 检查两个卡片是否重叠
        const checkOverlap = (x1, y1, w1, h1, x2, y2, w2, h2) => {
            return !(x1 + w1 < x2 || x2 + w2 < x1 || y1 + h1 < y2 || y2 + h2 < y1);
        };

        const drawAngleCard = (angle, jointX, jointY, label, color, standardRange = null, side = '') => {
            const isOutOfRange = standardRange && (angle < standardRange.min || angle > standardRange.max);
            
            const cardWidth = 100;
            const cardHeight = 50;
            
            let cardX, cardY;
            
            const isLeftSide = jointX < this.canvas.width * 0.4;
            const isRightSide = jointX > this.canvas.width * 0.6;
            const isTopSide = jointY < this.canvas.height * 0.35;
            const isBottomSide = jointY > this.canvas.height * 0.65;
            
            const isDominantSide = side === '持拍';
            
            // 预设多个候选位置
            const candidates = [];
            
            if (isDominantSide || side === '左') {
                candidates.push(
                    { x: Math.max(10, jointX - cardWidth - 25), y: Math.max(10, jointY - cardHeight - 20) },
                    { x: Math.max(10, jointX - cardWidth - 25), y: Math.min(this.canvas.height - cardHeight - 10, jointY + 25) },
                    { x: Math.max(10, jointX - cardWidth - 25), y: Math.max(10, Math.min(this.canvas.height - cardHeight - 10, jointY - cardHeight / 2)) }
                );
            } else {
                candidates.push(
                    { x: Math.min(this.canvas.width - cardWidth - 10, jointX + 25), y: Math.max(10, jointY - cardHeight - 20) },
                    { x: Math.min(this.canvas.width - cardWidth - 10, jointX + 25), y: Math.min(this.canvas.height - cardHeight - 10, jointY + 25) },
                    { x: Math.min(this.canvas.width - cardWidth - 10, jointX + 25), y: Math.max(10, Math.min(this.canvas.height - cardHeight - 10, jointY - cardHeight / 2)) }
                );
            }
            
            // 选择最佳位置（避免重叠）
            let bestCandidate = candidates[0];
            let minDistance = Infinity;
            
            for (const candidate of candidates) {
                let hasOverlap = false;
                for (const placed of placedCards) {
                    if (checkOverlap(candidate.x, candidate.y, cardWidth, cardHeight, placed.x, placed.y, placed.width, placed.height)) {
                        hasOverlap = true;
                        break;
                    }
                }
                
                if (!hasOverlap) {
                    const distance = Math.sqrt(Math.pow(candidate.x + cardWidth / 2 - jointX, 2) + Math.pow(candidate.y + cardHeight / 2 - jointY, 2));
                    if (distance < minDistance) {
                        minDistance = distance;
                        bestCandidate = candidate;
                    }
                }
            }
            
            cardX = bestCandidate.x;
            cardY = bestCandidate.y;
            
            // 记录已放置的卡片
            placedCards.push({ x: cardX, y: cardY, width: cardWidth, height: cardHeight });

            ctx.beginPath();
            ctx.moveTo(jointX, jointY);
            
            const midX = (jointX + cardX + cardWidth / 2) / 2;
            const midY = (jointY + cardY + cardHeight / 2) / 2;
            
            ctx.lineTo(midX, midY);
            ctx.lineTo(cardX + cardWidth / 2, cardY + cardHeight / 2);
            ctx.strokeStyle = isOutOfRange ? '#FF4444' : color;
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = isOutOfRange ? 'rgba(255, 68, 68, 0.95)' : 'rgba(255, 255, 255, 0.95)';
            ctx.strokeStyle = isOutOfRange ? '#FF4444' : color;
            ctx.lineWidth = isOutOfRange ? 2 : 1;
            ctx.beginPath();
            ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 6);
            ctx.fill();
            ctx.stroke();

            const displayLabel = side ? `${label}(${side})` : label;
            ctx.font = 'bold 11px Arial';
            ctx.fillStyle = isOutOfRange ? '#FFFFFF' : '#333333';
            ctx.textAlign = 'left';
            ctx.fillText(displayLabel, cardX + 6, cardY + 16);

            ctx.font = 'bold 20px Arial';
            ctx.fillStyle = isOutOfRange ? '#FFFFFF' : color;
            ctx.textAlign = 'left';
            ctx.fillText(`${angle.toFixed(0)}°`, cardX + 6, cardY + 36);

            if (standardRange) {
                ctx.font = '9px Arial';
                ctx.fillStyle = isOutOfRange ? '#FFDDDD' : '#666666';
                ctx.fillText(`标准: ${standardRange.min}-${standardRange.max}°`, cardX + 6, cardY + 47);
            }

            if (isOutOfRange) {
                ctx.font = 'bold 10px Arial';
                ctx.fillStyle = '#FFFFFF';
                const hint = angle < standardRange.min ? '偏小!' : '偏大!';
                ctx.textAlign = 'right';
                ctx.fillText(hint, cardX + cardWidth - 6, cardY + 18);
            }
        };

        const drawArmAngles = (shoulderIdx, elbowIdx, wristIdx, handIdx, side) => {
            if (landmarks[elbowIdx]?.visibility > 0.5 && landmarks[wristIdx]?.visibility > 0.5 && landmarks[shoulderIdx]?.visibility > 0.5) {
                const elbowAngle = this.calculateAngle(landmarks[shoulderIdx], landmarks[elbowIdx], landmarks[wristIdx]);
                drawAngleCard(elbowAngle,
                    landmarks[elbowIdx].x * this.canvas.width,
                    landmarks[elbowIdx].y * this.canvas.height,
                    '肘部', '#667eea', actionData?.elbowAngle, side);
            }

            if (landmarks[elbowIdx]?.visibility > 0.5 && landmarks[shoulderIdx]?.visibility > 0.5 && landmarks[dominantHipIdx]?.visibility > 0.5) {
                const shoulderAngle = this.calculateAngle(landmarks[elbowIdx], landmarks[shoulderIdx], landmarks[dominantHipIdx]);
                drawAngleCard(shoulderAngle,
                    landmarks[shoulderIdx].x * this.canvas.width,
                    landmarks[shoulderIdx].y * this.canvas.height,
                    '肩部', '#ed8936', actionData?.shoulderAngle, side);
            }

            if (landmarks[wristIdx]?.visibility > 0.5 && landmarks[handIdx]?.visibility > 0.5 && landmarks[elbowIdx]?.visibility > 0.5) {
                const wristAngle = this.calculateAngle(landmarks[elbowIdx], landmarks[wristIdx], landmarks[handIdx]);
                drawAngleCard(wristAngle,
                    landmarks[wristIdx].x * this.canvas.width,
                    landmarks[wristIdx].y * this.canvas.height,
                    '腕部', '#9370DB', actionData?.wristAngle, side);
            }
        };

        const drawLegAngles = (hipIdx, kneeIdx, otherHipIdx, side) => {
            if (landmarks[hipIdx]?.visibility > 0.5 && landmarks[kneeIdx]?.visibility > 0.5 && landmarks[otherHipIdx]?.visibility > 0.5) {
                const kneeAngle = this.calculateAngle(landmarks[otherHipIdx], landmarks[hipIdx], landmarks[kneeIdx]);
                drawAngleCard(kneeAngle,
                    landmarks[kneeIdx].x * this.canvas.width,
                    landmarks[kneeIdx].y * this.canvas.height,
                    '膝部', '#f56565', actionData?.kneeAngle, side);
            }

            if (landmarks[hipIdx]?.visibility > 0.5 && landmarks[otherHipIdx]?.visibility > 0.5 && landmarks[dominantShoulderIdx]?.visibility > 0.5) {
                const hipAngle = this.calculateAngle(landmarks[dominantShoulderIdx], landmarks[hipIdx], landmarks[otherHipIdx]);
                drawAngleCard(hipAngle,
                    landmarks[hipIdx].x * this.canvas.width,
                    landmarks[hipIdx].y * this.canvas.height,
                    '髋部', '#48bb78', actionData?.hipAngle, side);
            }
        };

        drawArmAngles(dominantShoulderIdx, dominantElbowIdx, dominantWristIdx, dominantHandIdx, '持拍');

        if (requireBothHands) {
            drawArmAngles(nonDominantShoulderIdx, nonDominantElbowIdx, nonDominantWristIdx, nonDominantHandIdx, '非持');
        }

        drawLegAngles(23, 25, 24, '左');
        drawLegAngles(24, 26, 23, '右');
    }

    drawTrajectoryOnCanvas(ctx) {
        if (this.trajectory.length < 2) return;

        ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);

        ctx.beginPath();
        ctx.moveTo(this.trajectory[0].x * this.canvas.width, this.trajectory[0].y * this.canvas.height);
        
        for (let i = 1; i < this.trajectory.length; i++) {
            ctx.lineTo(this.trajectory[i].x * this.canvas.width, this.trajectory[i].y * this.canvas.height);
        }
        
        ctx.stroke();
        ctx.setLineDash([]);
    }

    generateReportContent() {
        const { actionType, confidence, scores, issues, suggestions, timestamp } = this.analysisResult;
        const avgAngles = this.calculateAverageAngles();
        const motionDynamics = this.calculateMotionDynamics();
        const starCount = Math.round(scores.total / 20);
        const stars = '★'.repeat(starCount) + '☆'.repeat(5 - starCount);

        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>乒乓球AI动作分析报告</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; 
            color: #2d3748;
            background: #f7fafc;
            padding: 2rem;
        }
        .report-container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .report-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            text-align: center;
        }
        .report-title { font-size: 1.8rem; margin-bottom: 0.5rem; }
        .report-subtitle { opacity: 0.9; font-size: 0.95rem; }
        .report-date { margin-top: 1rem; opacity: 0.8; }
        .content-section { padding: 1.5rem 2rem; border-bottom: 1px solid #e2e8f0; }
        .section-title { 
            font-size: 1.2rem; 
            color: #667eea; 
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .score-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 12px;
            text-align: center;
            margin-bottom: 1.5rem;
        }
        .score-value { font-size: 4rem; font-weight: 700; line-height: 1; }
        .score-label { font-size: 1.1rem; opacity: 0.9; margin-top: 0.5rem; }
        .score-stars { font-size: 1.5rem; margin-top: 0.5rem; letter-spacing: 0.1rem; }
        .score-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
        }
        .score-item {
            background: #f7fafc;
            padding: 1rem;
            border-radius: 8px;
        }
        .score-name { font-weight: 600; margin-bottom: 0.3rem; }
        .score-bar {
            height: 8px;
            background: #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 0.3rem;
        }
        .score-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            border-radius: 4px;
        }
        .score-num { font-weight: 700; color: #667eea; }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
        }
        .stat-item {
            text-align: center;
            padding: 1rem;
            background: #f7fafc;
            border-radius: 8px;
        }
        .stat-label { font-size: 0.85rem; color: #718096; margin-bottom: 0.3rem; }
        .stat-value { font-size: 1.3rem; font-weight: 700; color: #667eea; }
        .issue-item {
            background: #fff5f5;
            border-left: 4px solid #fc8181;
            padding: 1rem;
            margin-bottom: 1rem;
            border-radius: 0 8px 8px 0;
        }
        .issue-title { 
            font-weight: 600; 
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .issue-severity {
            padding: 0.2rem 0.5rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 500;
        }
        .severity-high { background: #fed7d7; color: #c53030; }
        .severity-medium { background: #feebc8; color: #d69e2e; }
        .severity-low { background: #c6f6d5; color: #38a169; }
        .issue-image { max-width: 100%; max-height: 400px; border-radius: 8px; margin: 0.5rem 0; object-fit: contain; cursor: pointer; }
        .issue-desc { color: #4a5568; margin-bottom: 0.5rem; }
        .suggestion-item {
            display: flex;
            gap: 0.8rem;
            padding: 1rem;
            background: #ebf8ff;
            border-radius: 8px;
            margin-bottom: 0.5rem;
        }
        .suggestion-icon { font-size: 1.2rem; }
        .suggestion-text { flex: 1; }
        .report-footer {
            background: #f7fafc;
            padding: 1.5rem;
            text-align: center;
            color: #a0aec0;
            font-size: 0.9rem;
        }
        @media (max-width: 600px) {
            body { padding: 1rem; }
            .score-grid, .stats-grid { grid-template-columns: 1fr; }
            .score-value { font-size: 3rem; }
        }
    </style>
</head>
<body>
    <div class="report-container">
        <div class="report-header">
            <h1 class="report-title">🏆 乒乓球AI动作分析报告</h1>
            <p class="report-subtitle">专业的乒乓球动作评估与改进建议</p>
            <p class="report-date">📅 ${new Date(timestamp).toLocaleString()}</p>
        </div>

        <div class="content-section">
            <h2 class="section-title">📋 基本信息</h2>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                <div style="background: #f7fafc; padding: 1rem; border-radius: 8px;">
                    <div style="color: #718096; font-size: 0.9rem;">动作类型</div>
                    <div style="font-weight: 600; font-size: 1.1rem;">${actionType.name} (${actionType.nameEn})</div>
                </div>
                <div style="background: #f7fafc; padding: 1rem; border-radius: 8px;">
                    <div style="color: #718096; font-size: 0.9rem;">分析置信度</div>
                    <div style="font-weight: 600; font-size: 1.1rem;">${confidence}%</div>
                </div>
            </div>
        </div>

        <div class="content-section">
            <h2 class="section-title">🎯 综合评分</h2>
            <div class="score-card">
                <div class="score-value">${scores.total}</div>
                <div class="score-label">/100 (${this.getScoreLevel(scores.total)})</div>
                <div class="score-stars">${stars}</div>
            </div>
        </div>

        <div class="content-section">
            <h2 class="section-title">📊 详细评分</h2>
            <div class="score-grid">
                <div class="score-item">
                    <div class="score-name">姿态规范性</div>
                    <div class="score-bar"><div class="score-fill" style="width: ${scores.posture}%"></div></div>
                    <div class="score-num">${scores.posture.toFixed(1)}/100</div>
                </div>
                <div class="score-item">
                    <div class="score-name">动作连贯性</div>
                    <div class="score-bar"><div class="score-fill" style="width: ${scores.continuity}%"></div></div>
                    <div class="score-num">${scores.continuity.toFixed(1)}/100</div>
                </div>
                <div class="score-item">
                    <div class="score-name">发力合理性</div>
                    <div class="score-bar"><div class="score-fill" style="width: ${scores.power}%"></div></div>
                    <div class="score-num">${scores.power.toFixed(1)}/100</div>
                </div>
                <div class="score-item">
                    <div class="score-name">动作完整性</div>
                    <div class="score-bar"><div class="score-fill" style="width: ${scores.completeness}%"></div></div>
                    <div class="score-num">${scores.completeness.toFixed(1)}/100</div>
                </div>
            </div>
        </div>

        <div class="content-section">
            <h2 class="section-title">📈 数据分析统计</h2>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-label">分析帧数</div>
                    <div class="stat-value">${this.poseResults.length}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">关键帧数</div>
                    <div class="stat-value">${this.keyFrames.length}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">平均肘部角度</div>
                    <div class="stat-value">${avgAngles.elbow.toFixed(1)}°</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">平均肩部角度</div>
                    <div class="stat-value">${avgAngles.shoulder.toFixed(1)}°</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">平均运动速度</div>
                    <div class="stat-value">${motionDynamics.avgSpeed.toFixed(3)}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">最大运动速度</div>
                    <div class="stat-value">${motionDynamics.maxSpeed.toFixed(3)}</div>
                </div>
            </div>
        </div>

        <div class="content-section">
            <h2 class="section-title">🔍 问题诊断</h2>
            ${issues.length === 0 ? 
                '<div style="text-align: center; padding: 2rem; color: #48bb78;">✅ 未发现明显问题，动作表现良好！</div>' :
                issues.map((issue, index) => `
                    <div class="issue-item">
                        <div class="issue-title">
                            ${index + 1}. ${issue.title}
                            <span class="issue-severity severity-${issue.severity}">${this.getSeverityText(issue.severity)}</span>
                        </div>
                        ${issue.image ? `<img src="${issue.image}" class="issue-image" alt="问题截图">` : ''}
                        <div class="issue-desc">${issue.description}</div>
                        <div style="font-size: 0.85rem; color: #718096;">问题帧: 第${issue.frame}帧 (${(issue.frame / this.fps).toFixed(1)}秒)</div>
                        ${issue.suggestion ? `<div style="margin-top: 0.5rem; padding: 0.75rem; background: #ebf8ff; border-radius: 6px;">💡 ${issue.suggestion}</div>` : ''}
                    </div>
                `).join('')
            }
        </div>

        <div class="content-section">
            <h2 class="section-title">💡 修正建议</h2>
            ${suggestions.map((suggestion, index) => `
                <div class="suggestion-item">
                    <span class="suggestion-icon">${index + 1}.</span>
                    <span class="suggestion-text">${suggestion}</span>
                </div>
            `).join('')}
        </div>

        <div class="report-footer">
            <p>---</p>
            <p>报告由 乒乓球AI动作分析助手 自动生成</p>
            <p style="margin-top: 0.5rem; font-size: 0.8rem;">仅供训练参考，实际训练请结合专业指导</p>
        </div>
    </div>
</body>
</html>`;
    }

    checkFirstTimeUser() {
        const hasVisited = localStorage.getItem('tableTennisAnalyzer_visited');
        if (!hasVisited) {
            document.getElementById('firstTimeGuide').classList.add('active');
        }
    }

    closeGuide() {
        document.getElementById('firstTimeGuide').classList.remove('active');
        localStorage.setItem('tableTennisAnalyzer_visited', 'true');
    }

    showVideoGuide() {
        const skipGuide = localStorage.getItem('tableTennisAnalyzer_skipVideoGuide');
        if (!skipGuide) {
            document.getElementById('videoGuide').classList.add('active');
        } else {
            this.triggerFileInput();
        }
    }

    confirmVideoGuide() {
        document.getElementById('videoGuide').classList.remove('active');
        
        if (document.getElementById('rememberGuide').checked) {
            localStorage.setItem('tableTennisAnalyzer_skipVideoGuide', 'true');
        }
        
        this.triggerFileInput();
    }

    skipVideoGuide() {
        document.getElementById('videoGuide').classList.remove('active');
        this.triggerFileInput();
    }

    triggerFileInput() {
        document.getElementById('videoInput').click();
    }



    onVideoEnded() {
        this.stopAnalysis();
        document.getElementById('playPauseBtn').innerHTML = '<span class="icon-play">▶</span>';
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    detectActionPhases(poseResults) {
        if (!poseResults || poseResults.length < 10) {
            return null;
        }

        const isRightHanded = this.dominantHand === 'right';
        const wristIdx = isRightHanded ? 16 : 15;
        
        const velocities = [];
        const accelerations = [];
        
        for (let i = 1; i < poseResults.length; i++) {
            const prevLandmark = poseResults[i - 1].landmarks[wristIdx];
            const currLandmark = poseResults[i].landmarks[wristIdx];
            
            if (prevLandmark && currLandmark) {
                const dx = currLandmark.x - prevLandmark.x;
                const dy = currLandmark.y - prevLandmark.y;
                const velocity = Math.sqrt(dx * dx + dy * dy) * 100;
                velocities.push(velocity);
                
                if (velocities.length > 1) {
                    accelerations.push(velocities[i - 1] - velocities[i - 2]);
                }
            }
        }

        const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;
        const maxVelocity = Math.max(...velocities);
        const velocityThreshold = avgVelocity * 2;
        const hitThreshold = maxVelocity * 0.7;

        let phases = {
            preparation: { start: 0, end: 0, frames: [] },
            swing: { start: 0, end: 0, frames: [] },
            hit: { start: 0, end: 0, frames: [] },
            followThrough: { start: 0, end: poseResults.length - 1, frames: [] }
        };

        let hitFrame = -1;
        for (let i = 0; i < velocities.length; i++) {
            if (velocities[i] >= hitThreshold) {
                hitFrame = i;
                break;
            }
        }

        if (hitFrame === -1) {
            hitFrame = Math.floor(velocities.length / 2);
        }

        let swingStart = -1;
        for (let i = hitFrame - 1; i >= 0; i--) {
            if (velocities[i] < velocityThreshold) {
                swingStart = i + 1;
                break;
            }
        }
        swingStart = swingStart === -1 ? Math.max(0, hitFrame - 10) : swingStart;

        let followStart = -1;
        for (let i = hitFrame + 1; i < velocities.length; i++) {
            if (velocities[i] < velocityThreshold) {
                followStart = i;
                break;
            }
        }
        followStart = followStart === -1 ? hitFrame + 5 : followStart;

        phases.preparation = { start: 0, end: swingStart, frames: poseResults.slice(0, swingStart + 1) };
        phases.swing = { start: swingStart, end: hitFrame, frames: poseResults.slice(swingStart, hitFrame + 1) };
        phases.hit = { start: hitFrame, end: hitFrame + 2, frames: poseResults.slice(Math.max(0, hitFrame - 1), Math.min(poseResults.length, hitFrame + 3)) };
        phases.followThrough = { start: hitFrame + 1, end: poseResults.length - 1, frames: poseResults.slice(hitFrame + 1) };

        return phases;
    }

    analyzePhaseData(phases, isRightHanded) {
        if (!phases) return null;

        const elbowIdx = isRightHanded ? 14 : 13;
        const shoulderIdx = isRightHanded ? 12 : 11;
        const wristIdx = isRightHanded ? 16 : 15;
        const hipIdx = isRightHanded ? 24 : 23;

        const phaseData = {};

        for (const phaseName of ['preparation', 'swing', 'hit', 'followThrough']) {
            const phase = phases[phaseName];
            if (!phase || phase.frames.length === 0) {
                phaseData[phaseName] = null;
                continue;
            }

            const angles = { elbow: [], shoulder: [], wrist: [], hip: [] };
            const velocities = [];

            for (const frame of phase.frames) {
                const landmarks = frame.landmarks;
                
                if (landmarks[elbowIdx]?.visibility > 0.5 && landmarks[shoulderIdx]?.visibility > 0.5 && landmarks[wristIdx]?.visibility > 0.5) {
                    angles.elbow.push(this.calculateAngle(landmarks[shoulderIdx], landmarks[elbowIdx], landmarks[wristIdx]));
                }
                
                if (landmarks[shoulderIdx]?.visibility > 0.5 && landmarks[hipIdx]?.visibility > 0.5 && landmarks[elbowIdx]?.visibility > 0.5) {
                    angles.shoulder.push(this.calculateAngle(landmarks[hipIdx], landmarks[shoulderIdx], landmarks[elbowIdx]));
                }

                if (velocities.length > 0 && landmarks[wristIdx]) {
                    const prevFrame = phase.frames[velocities.length - 1];
                    if (prevFrame?.landmarks[wristIdx]) {
                        const dx = landmarks[wristIdx].x - prevFrame.landmarks[wristIdx].x;
                        const dy = landmarks[wristIdx].y - prevFrame.landmarks[wristIdx].y;
                        velocities.push(Math.sqrt(dx * dx + dy * dy) * 100);
                    }
                }
                velocities.push(0);
            }

            phaseData[phaseName] = {
                frameCount: phase.frames.length,
                duration: phase.frames.length / 30,
                elbow: {
                    avg: angles.elbow.length > 0 ? angles.elbow.reduce((a, b) => a + b, 0) / angles.elbow.length : null,
                    min: angles.elbow.length > 0 ? Math.min(...angles.elbow) : null,
                    max: angles.elbow.length > 0 ? Math.max(...angles.elbow) : null,
                    values: angles.elbow
                },
                shoulder: {
                    avg: angles.shoulder.length > 0 ? angles.shoulder.reduce((a, b) => a + b, 0) / angles.shoulder.length : null,
                    min: angles.shoulder.length > 0 ? Math.min(...angles.shoulder) : null,
                    max: angles.shoulder.length > 0 ? Math.max(...angles.shoulder) : null,
                    values: angles.shoulder
                },
                velocity: {
                    avg: velocities.length > 0 ? velocities.reduce((a, b) => a + b, 0) / velocities.length : null,
                    max: velocities.length > 0 ? Math.max(...velocities) : null
                }
            };
        }

        return phaseData;
    }

    getPhaseDisplayName(phaseName) {
        const names = {
            preparation: '准备阶段',
            swing: '挥拍阶段',
            hit: '击球阶段',
            followThrough: '随挥阶段'
        };
        return names[phaseName] || phaseName;
    }

    getPhaseColor(phaseName) {
        const colors = {
            preparation: '#48bb78',
            swing: '#ed8936',
            hit: '#f56565',
            followThrough: '#667eea'
        };
        return colors[phaseName] || '#718096';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.tableTennisAnalyzer = new TableTennisAnalyzer();
});